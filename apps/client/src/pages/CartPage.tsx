import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { EmptyCart } from '../components/EmptyCar';
import { CheckoutInfo } from '../components/CheckoutInfo';

export const CartPage = () => {
    const navigate = useNavigate();
    const cartItems = useAppSelector((state) => state.cart.items);

    const handleStartShopping = () => {
        navigate('/');
    };

    const handleNavigate = (tab: 'shop' | 'cart') => {
        if (tab === 'shop') {
            navigate('/');
        }
    };

    if (cartItems.length === 0) {
        return (
            <EmptyCart
                onStartShopping={handleStartShopping}
                onNavigate={handleNavigate}
            />
        );
    }

    return (
        <CheckoutInfo
            cartItems={cartItems}
            onNavigateBack={() => navigate('/')}
        />
    );
};
