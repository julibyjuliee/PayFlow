import { configureStore, combineReducers } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import checkoutReducer from "./slices/checkoutSlice";
import productReducer from './slices/productSlice';
import {
    localStorageMiddleware,
    loadStateFromStorage,
} from "./middleware/localStorageMiddleware";

const rootReducer = combineReducers({
    cart: cartReducer,
    checkout: checkoutReducer,
    products: productReducer
});

const persistedState = loadStateFromStorage();

export const store = configureStore({
    reducer: rootReducer,
    preloadedState: persistedState,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ["checkout/createTransaction"],
                ignoredActionPaths: ["payload.timestamp"],
                ignoredPaths: ["checkout.currentTransaction.timestamp"],
            },
        }).concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
