import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';

export const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determinar el tab activo basado en la ruta actual
    const getActiveTab = (): 'shop' | 'cart' => {
        if (location.pathname.startsWith('/cart') || location.pathname.startsWith('/checkout')) {
            return 'cart';
        }
        return 'shop';
    };

    const handleNavigate = (tab: 'shop' | 'cart') => {
        if (tab === 'shop') {
            navigate('/');
        } else if (tab === 'cart') {
            navigate('/cart');
        }
    };

    return (
        <div className="min-h-screen">
            <Header activeTab={getActiveTab()} onNavigate={handleNavigate} />
            <Outlet />
        </div>
    );
};
