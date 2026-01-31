import React from 'react';
import type { Product } from '../../types/index';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    quantity: number;
    onViewCart: () => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, product, quantity, onViewCart }) => {
    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-10 sm:pt-20 bg-slate-900/10 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#FDF2E9] rounded-3xl shadow-2xl border border-white/50 p-6 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div
                        className="size-20 bg-center bg-no-repeat bg-cover rounded-2xl flex-shrink-0"
                        style={{ backgroundImage: `url("${product.imageUrl}")` }}
                    ></div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>
                                check_circle
                            </span>
                            {quantity} {quantity === 1 ? 'unidad agregada' : 'unidades agregadas'} al carrito
                        </div>
                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                        <p className="text-slate-500 text-sm">${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(product.price))}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onViewCart}
                        className="w-full bg-[#E67E22] text-white h-14 rounded-2xl font-bold text-lg tracking-tight transition-all shadow-lg shadow-[#E67E22]/20 active:scale-[0.98]"
                    >
                        Ver Carrito
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full border-2 border-[#E67E22] text-[#E67E22] h-14 rounded-2xl font-bold text-lg tracking-tight transition-all active:scale-[0.98]"
                    >
                        Seguir Comprando
                    </button>
                </div>
            </div>
        </div>
    );
};