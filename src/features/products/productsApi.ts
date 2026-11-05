// src/features/products/productsApi.ts
import { baseApi } from '@/api/baseApi';

export interface ProductDto {
    id: string;
    name: string;
    sku: string;
    brand: string;
    barcode: string | null;
}

export interface CreateProductRequest {
    name: string;
    sku: string;
    brand: string;
    barcode?: string;
}

export const productsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProducts: builder.query<ProductDto[], void>({
            query: () => 'products',
            providesTags: ['Parts'],
        }),
        createProduct: builder.mutation<ProductDto, CreateProductRequest>({
            query: (newProduct) => ({
                url: 'products',
                method: 'POST',
                body: newProduct,
            }),
            invalidatesTags: ['Parts'], // Автоматически перерисует таблицу
        }),
        deleteProduct: builder.mutation<void, string>({
            query: (id) => ({
                url: `products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Parts'],
        }),
        // GET-запрос ZPL-кода этикетки детали для принтера
        getProductLabel: builder.query<{ zplCode: string }, string>({
            query: (id) => `labels/product/${id}`,
        }),
    }),
});

export const {
    useGetProductsQuery,
    useCreateProductMutation,
    useDeleteProductMutation,
    useLazyGetProductLabelQuery
} = productsApi;