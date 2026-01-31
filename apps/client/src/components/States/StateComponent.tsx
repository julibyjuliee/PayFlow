import { useNavigate } from 'react-router-dom';
import { Header } from '../Header';

type OrderStatus = 'success' | 'error' | 'pending';

interface StateComponentProps {
    status: OrderStatus;
    orderNumber?: string;
    deliveryAddress?: {
        street: string;
        city: string;
        postalCode: string;
    };
    customerInfo?: {
        firstName: string;
        lastName: string;
    };
    product?: {
        name: string;
        price: number;
        quantity: number;
        imageUrl?: string;
    };
    totalAmount?: number;
    errorMessage?: string;
    onNavigate?: (tab: 'shop' | 'cart') => void;
}

const statusConfig = {
    success: {
        icon: 'check',
        iconBgColor: 'bg-green-100/60 dark:bg-green-900/20',
        iconInnerBgColor: 'bg-white dark:bg-green-400/40',        
        iconColor: 'text-sage-icon',
        title: '¡Gracias por su compra!',
        message: 'Su pedido ha sido procesado con éxito.\nEn unos minutos será despachado.',
        buttonText: 'Continuar Comprando',
        buttonAction: '/',
    },
    error: {
        icon: 'close',
        iconBgColor: 'bg-red-100/60 dark:bg-red-900/20',
        iconInnerBgColor: 'bg-white dark:bg-red-400/40',
        iconColor: 'text-red-500',
        title: 'Pago Fallido',
        message: 'No se pudo procesar su pago.\nPor favor, intente nuevamente o utilice otro método de pago.',
        buttonText: 'Intentar de Nuevo',
        buttonAction: '/cart',
    },
    pending: {
        icon: 'schedule',
        iconBgColor: 'bg-amber-100 dark:bg-amber-900/20',
        iconInnerBgColor: 'bg-white dark:bg-amber-400/20',
        iconColor: 'text-amber-500',
        title: 'Pago Pendiente',
        message: 'Tu pago está siendo procesado.\nTe notificaremos una vez que se complete la transacción.',
        buttonText: 'Intentar de Nuevo',
        buttonAction: '/cart',
    },
};

export const StateComponent = ({
    status,
    orderNumber,
    deliveryAddress,
    totalAmount,
    errorMessage,
    onNavigate,
}: StateComponentProps) => {
    const navigate = useNavigate();
    const config = statusConfig[status];

    const handleNavigateTab = (tab: 'shop' | 'cart') => {
        if (onNavigate) {
            onNavigate(tab);
        } else {
            navigate(tab === 'shop' ? '/' : '/cart');
        }
    };

    const handleButtonClick = () => {
        navigate(config.buttonAction);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header activeTab="cart" onNavigate={handleNavigateTab} />

            <main className="flex-1 max-w-[1280px] mx-auto px-6 py-12 flex flex-col items-center text-center w-full">
                {/* Status Icon */}
                <div className={`size-24 ${config.iconBgColor} rounded-full flex items-center justify-center mb-8`}>
                    <div className={`size-16 ${config.iconInnerBgColor} rounded-full flex items-center justify-center shadow-sm`}>
                        <span className={`material-symbols-outlined ${config.iconColor} text-4xl font-bold`}>
                            {config.icon}
                        </span>
                    </div>
                </div>

                {/* Title and Message */}
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                    {config.title}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 leading-relaxed whitespace-pre-line">
                    {errorMessage && status === 'error' ? errorMessage : config.message}
                </p>

                {/* Order Information Card */}
                <div className="w-full max-w-md bg-white border border-slate-100 dark:border-slate-800 rounded-3xl p-6 mb-10 shadow-sm">
                    <div className="space-y-4 text-left">
                        {/* Order Number */}
                        {orderNumber && (
                            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                                <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">
                                    Número de Orden
                                </span>
                                <span className="text-slate-900 font-bold">
                                    #{orderNumber}
                                </span>
                            </div>
                        )}
                        

                        {/* Delivery Address and Total */}
                        <div className="flex justify-between items-start pt-2">
                            {deliveryAddress && (
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                                        Dirección de Entrega
                                    </p>
                                    <p className="text-sm text-slate-700 ">
                                        {deliveryAddress.street}<br />
                                        {deliveryAddress.city}, {deliveryAddress.postalCode}
                                    </p>
                                </div>
                            )}
                            {totalAmount !== undefined && (
                                <div className="text-right">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                                        Total
                                    </p>
                                    <p className="text-lg font-bold text-sunset-orange">
                                        ${new Intl.NumberFormat('es-CO').format(totalAmount)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full max-w-md space-y-4">
                    <button
                        onClick={handleButtonClick}
                        className="w-full bg-orange-500 text-white h-14 rounded-2xl font-bold text-base tracking-tight shadow-lg"
                    >
                        {config.buttonText}
                    </button>
                </div>
            </main>

            <footer className="mt-auto max-w-[1280px] mx-auto w-full p-8 text-center">
                <p className="text-[11px] text-slate-400 uppercase tracking-[0.2em]">
                    Construimos con amor
                </p>
            </footer>
        </div>
    );
};
