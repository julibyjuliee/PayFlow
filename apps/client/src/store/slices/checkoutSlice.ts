import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "../../types";

export interface ShippingAddress {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
}

export interface PaymentInfo {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
}

export interface Transaction {
    id: string;
    timestamp: number;
    product: Product;
    quantity: number;
    shippingAddress: ShippingAddress;
    email: string;
    paymentInfo: Omit<PaymentInfo, "cvv">;
    subtotal: number;
    tax: number;
    total: number;
    status: "pending" | "completed" | "failed";
}

export interface CheckoutState {
    currentTransaction: Transaction | null;
    transactions: Transaction[];
    shippingAddress: ShippingAddress | null;
    paymentTotal: number | null;
}

const initialState: CheckoutState = {
    currentTransaction: null,
    transactions: [],
    shippingAddress: null,
    paymentTotal: null,
};

const checkoutSlice = createSlice({
    name: "checkout",
    initialState,
    reducers: {
        setShippingAddress: (state, action: PayloadAction<ShippingAddress>) => {
            state.shippingAddress = action.payload;
        },

        setPaymentTotal: (state, action: PayloadAction<number>) => {
            state.paymentTotal = action.payload;
        },

        createTransaction: (
            state,
            action: PayloadAction<{
                product: Product;
                quantity: number;
                shippingAddress: ShippingAddress;
                paymentInfo: PaymentInfo;
                email: string;
            }>
        ) => {
            const { product, quantity, shippingAddress, paymentInfo } = action.payload;
            const subtotal = product.price * quantity;
            const tax = subtotal * 0.08;
            const total = subtotal + tax;

            const transaction: Transaction = {
                id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                product,
                quantity,
                shippingAddress,
                paymentInfo: {
                    cardNumber: `****${paymentInfo.cardNumber.slice(-4)}`, // Only store last 4 digits
                    expiryDate: paymentInfo.expiryDate,
                },
                subtotal,
                tax,
                total,
                status: "pending",
                email: action.payload.email
            };

            state.currentTransaction = transaction;
        },

        completeTransaction: (state) => {
            if (state.currentTransaction) {
                state.currentTransaction.status = "completed";
                state.transactions.push(state.currentTransaction);
                state.currentTransaction = null;
            }
        },

        failTransaction: (state) => {
            if (state.currentTransaction) {
                state.currentTransaction.status = "failed";
                state.transactions.push(state.currentTransaction);
                state.currentTransaction = null;
            }
        },

        clearCurrentTransaction: (state) => {
            state.currentTransaction = null;
        },

        // Load transactions from localStorage
        loadTransactionsFromStorage: (
            _state,
            action: PayloadAction<CheckoutState>
        ) => {
            return action.payload;
        },
    },
});

export const {
    setShippingAddress,
    setPaymentTotal,
    createTransaction,
    completeTransaction,
    failTransaction,
    clearCurrentTransaction,
    loadTransactionsFromStorage,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
