import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { CheckoutInfo } from '../components/CheckoutInfo';
import { EmptyCart } from '../components/EmptyCar';

export const CheckoutPage = () => {
    const navigate = useNavigate();
    const cartItems = useAppSelector((state) => state.cart.items);

    if (cartItems.length === 0) {
        return (
            <EmptyCart
                onStartShopping={() => navigate('/')}
                onNavigate={(tab) => navigate(tab === 'shop' ? '/' : '/cart')}
            />
        );
    }

    return (
        <CheckoutInfo
            cartItems={cartItems}
            onNavigateBack={() => navigate('/cart')}
        />
    );
};
