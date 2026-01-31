interface ModalActionsProps {
    isProcessing: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export const ModalActions = ({ isProcessing, onCancel, onConfirm }: ModalActionsProps) => {
    return (
        <div className="flex gap-4">
            <button
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1 h-12 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Cancelar
            </button>
            <button
                onClick={onConfirm}
                disabled={isProcessing}
                className="flex-[2] h-12 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                    </>
                ) : (
                    <>
                        Pagar Ahora
                        <span className="material-symbols-outlined text-sm">payments</span>
                    </>
                )}
            </button>
        </div>
    );
};
