import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Product } from '../../types';

export const fetchProducts = createAsyncThunk('products/fetchAll', async () => {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Error al obtener productos');
    return await response.json();
});

interface ProductState {
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
                state.error = action.error.message || 'Error al cargar productos';
            });
    },
});

export default productSlice.reducer;