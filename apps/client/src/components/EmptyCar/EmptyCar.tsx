import { Header } from "../Header";

interface EmptyCartProps {
    onStartShopping?: () => void;
    onNavigate?: (tab: "shop" | "cart") => void;
}

export const EmptyCart = ({ onStartShopping, onNavigate }: EmptyCartProps) => {
    const handleStartShopping = () => {
        if (onStartShopping) {
            onStartShopping();
        }
    };

    return (
        <div className="min-h-screen">
            <Header activeTab="cart" onNavigate={onNavigate} />

            <main className="flex-1 flex flex-col items-center justify-center px-8 text-center py-24">
                {/* Empty Cart Icon */}
                <div className="relative mb-8">
                    <div className="w-48 h-48 bg-sunset-peach rounded-full flex items-center justify-center">
                        <div className="relative">
                            <span className="material-symbols-outlined text-[100px] text-orange-200/80 dark:text-orange-950">
                                shopping_bag
                            </span>
                            <span className="material-symbols-outlined absolute -top-2 -right-2 text-sunset-gold opacity-50 text-3xl">
                                flare
                            </span>
                        </div>
                    </div>
                </div>

                {/* Empty Cart Message */}
                <h1 className="text-2xl font-bold tracking-tight text-terracotta mb-3">
                    Tu carrito está vacío
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-[280px] mb-10">
                    Agrega productos a tu carrito para verlos aquí y proceder al pago.
                </p>

                {/* Start Shopping Button */}
                <button
                    onClick={handleStartShopping}
                    className="w-full max-w-[240px] bg-orange-600 text-white h-14 rounded-2xl font-bold text-lg tracking-tight transition-all shadow-xl shadow-sunset-orange/20"
                >
                    Comprar
                </button>
            </main>
        </div>
    );
};