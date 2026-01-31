import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Product } from '../../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchProducts = createAsyncThunk(
    'products/fetchAll',
    async (_, { rejectWithValue }) => {
        const baseUrl = import.meta.env.VITE_API_URL;
        const maxRetries = 3;
        const retryDelay = 3000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(`${baseUrl}/products`);

                if (!response.ok) {
                    throw new Error('Error al obtener productos');
                }

                return await response.json();
            } catch (error) {
                const isLastAttempt = attempt === maxRetries - 1;
                const isConnectionError = error instanceof TypeError && error.message.includes('fetch');

                if (isConnectionError && !isLastAttempt) {
                    await delay(retryDelay);
                    continue;
                }

                return rejectWithValue(error instanceof Error ? error.message : 'Error al cargar productos');
            }
        }

        return rejectWithValue('Error al cargar productos después de varios intentos');
    }
);

export interface ProductState {
    items: Product[];
    loading: boolean;
    error: string | null;
}

const initialState: ProductState = {
    items: [],
    loading: false,
    error: null,
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        // Aquí irían reducers síncronos si los necesitaras
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Error al cargar productos';
            });
    },
});

export default productSlice.reducer;