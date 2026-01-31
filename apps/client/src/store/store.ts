import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import checkoutReducer from "./slices/checkoutSlice";
import productReducer from './slices/productSlice';
import {
    localStorageMiddleware,
    loadStateFromStorage,
} from "./middleware/localStorageMiddleware";

// Load persisted state
const persistedState = loadStateFromStorage();

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        checkout: checkoutReducer,
        products: productReducer
    },
    preloadedState: persistedState,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ["checkout/createTransaction"],
                // Ignore these field paths in all actions
                ignoredActionPaths: ["payload.timestamp"],
                // Ignore these paths in the state
                ignoredPaths: ["checkout.currentTransaction.timestamp"],
            },
        }).concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
