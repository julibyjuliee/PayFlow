import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "../../types";

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
}

const initialState: CartState = {
    items: [],
    totalItems: 0,
    totalAmount: 0,
};

// Helper function to calculate totals
const calculateTotals = (items: CartItem[]) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );
    return { totalItems, totalAmount };
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<{ product: Product; quantity: number }>) => {
            const { product, quantity } = action.payload;
            const existingItem = state.items.find(
                (item) => item.product.id === product.id
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                state.items.push({ product, quantity });
            }

            const totals = calculateTotals(state.items);
            state.totalItems = totals.totalItems;
            state.totalAmount = totals.totalAmount;
        },

        removeFromCart: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(
                (item) => item.product.id !== action.payload
            );

            const totals = calculateTotals(state.items);
            state.totalItems = totals.totalItems;
            state.totalAmount = totals.totalAmount;
        },

        updateQuantity: (
            state,
            action: PayloadAction<{ productId: string; quantity: number }>
        ) => {
            const { productId, quantity } = action.payload;
            const item = state.items.find((item) => item.product.id === productId);

            if (item) {
                item.quantity = quantity;
            }

            const totals = calculateTotals(state.items);
            state.totalItems = totals.totalItems;
            state.totalAmount = totals.totalAmount;
        },

        clearCart: (state) => {
            state.items = [];
            state.totalItems = 0;
            state.totalAmount = 0;
        },

        // Load cart from localStorage
        loadCartFromStorage: (state, action: PayloadAction<CartState>) => {
            return action.payload;
        },
    },
});

export const {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCartFromStorage,
} = cartSlice.actions;

export default cartSlice.reducer;
