interface PaymentSummaryProps {
    total: number;
}

export const PaymentSummary = ({ total }: PaymentSummaryProps) => {
    return (
        <div className="space-y-4 mb-8">
            <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-4">
                <span>Envío</span>
                <span className="text-green-600 font-medium">Gratis</span>
            </div>
            <div className="pt-2 flex justify-between text-2xl font-black text-orange-600">
                <span>Total</span>
                <span>${new Intl.NumberFormat('es-CO').format(total)}</span>
            </div>
        </div>
    );
};
