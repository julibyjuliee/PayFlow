import { useAppSelector } from "../../store/hooks";

interface HeaderProps {
    activeTab?: 'shop' | 'cart';
    onNavigate?: (tab: 'shop' | 'cart') => void;
}

export const Header = ({ activeTab = 'shop', onNavigate }: HeaderProps) => {
    const cartItemsCount = useAppSelector(state => state.cart.totalItems);

    return (
        <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <a
                        className="text-xl font-bold tracking-tight text-sunset-orange flex items-center gap-2 cursor-pointer"
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigate?.('shop');
                        }}
                    >
                        <span className="material-symbols-outlined">wb_twilight</span>
                        STUDIO
                    </a>
                </div>
                <nav className="flex items-center gap-10">
                    <a
                        className={`flex items-center gap-2 font-semibold transition-colors cursor-pointer ${activeTab === 'shop'
                            ? 'text-sunset-orange'
                            : 'text-slate-500 hover:text-sunset-orange'
                            }`}
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigate?.('shop');
                        }}
                    >
                        <span
                            className={`material-symbols-outlined text-2xl ${activeTab === 'shop' ? 'fill-icon' : ''
                                }`}
                        >
                            storefront
                        </span>
                        <span className="text-sm uppercase tracking-widest">Tienda</span>
                    </a>
                    <a
                        className={`flex items-center gap-2 font-semibold transition-colors cursor-pointer relative ${activeTab === 'cart'
                            ? 'text-sunset-orange'
                            : 'text-slate-500 hover:text-sunset-orange'
                            }`}
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigate?.('cart');
                        }}
                    >
                        <div className="relative">
                            <span
                                className={`material-symbols-outlined text-2xl ${activeTab === 'cart' ? 'fill-icon' : ''
                                    }`}
                            >
                                shopping_cart
                            </span>
                            {cartItemsCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-sunset-orange text-white text-xs font-bold rounded-full size-5 flex items-center justify-center">
                                    {cartItemsCount}
                                </span>
                            )}
                        </div>
                        <span className="text-sm uppercase tracking-widest">Carrito</span>
                    </a>
                </nav>
            </div>
        </header>
    );
};
