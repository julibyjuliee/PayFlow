import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sunset-peach to-white">
            <div className="text-center px-6">
                <div className="mb-8">
                    <span className="material-symbols-outlined text-9xl text-sunset-orange">
                        sentiment_dissatisfied
                    </span>
                </div>
                <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-slate-700 mb-4">
                    Página no encontrada
                </h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    Lo sentimos, la página que estás buscando no existe o ha sido
                    movida.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg tracking-tight transition-all shadow-lg shadow-sunset-orange/20 hover:bg-orange-700"
                >
                    Volver al inicio
                </button>
            </div>
        </div>
    );
};
