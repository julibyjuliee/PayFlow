import type { CartItem } from '../../store/slices/cartSlice';

interface OrderSummaryProps {
    items: CartItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    isFormValid: boolean;
    onRemoveItem: (productId: string) => void;
    onProceedToReview: () => void;
}

export const OrderSummary = ({
    items,
    subtotal,
    tax,
    total,
    isFormValid,
    onRemoveItem,
    onProceedToReview,
}: OrderSummaryProps) => {
    return (
        <div className="sticky top-28 bg-white rounded-3xl p-6 border border-orange-100 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Resumen de la compra</h3>

            {/* Product List */}
            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto">
                {items.map((item, index) => (
                    <div
                        key={`${item.product.id}-${index}`}
                        className="flex gap-4 pb-4 border-b border-orange-50 last:border-b-0 relative group"
                    >
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
                                $
                                {new Intl.NumberFormat('es-CO', {
                                    maximumFractionDigits: 0,
                                }).format(Number(item.product.price))}{' '}
                                x {item.quantity}
                            </p>
                        </div>
                        <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="absolute top-0 right-0 size-6 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                            aria-label={`Eliminar ${item.product.name}`}
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t border-orange-50 pt-6 mb-8">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>
                        $
                        {new Intl.NumberFormat('es-CO', {
                            maximumFractionDigits: 0,
                        }).format(Number(subtotal.toFixed(2)))}
                    </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Envío</span>
                    <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Impuestos Incluidos</span>
                    <span>
                        $
                        {new Intl.NumberFormat('es-CO', {
                            maximumFractionDigits: 0,
                        }).format(Number(tax.toFixed(2)))}
                    </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-orange-50">
                    <span>Total</span>
                    <span className="text-slate-900">
                        $
                        {new Intl.NumberFormat('es-CO', {
                            maximumFractionDigits: 0,
                        }).format(Number(total.toFixed(2)))}
                    </span>
                </div>
            </div>

            {/* Proceed Button */}
            <button
                onClick={onProceedToReview}
                disabled={!isFormValid}
                className={`w-full h-14 rounded-2xl font-bold text-lg tracking-tight transition-all flex items-center justify-center gap-2 ${isFormValid
                        ? 'bg-orange-600 text-white shadow-lg shadow-sunset-orange/20 hover:bg-orange-700 cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
            >
                Pagar ahora
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
            {!isFormValid && (
                <p className="text-center text-xs text-red-500 mt-2">
                    Por favor completa todos los campos correctamente
                </p>
            )}

            {/* Terms */}
            <p className="text-center text-xs text-slate-400 mt-4 px-4 leading-relaxed">
                Al continuar, acepta nuestros Términos de servicio y Política de
                privacidad.
            </p>
        </div>
    );
};
