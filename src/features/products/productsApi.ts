// src/features/products/productsApi.ts
import { baseApi } from '@/api/baseApi';
import { type LabelSizeType } from '@/shared/constants/labels';

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
            providesTags: ['Products'],
        }),
        createProduct: builder.mutation<ProductDto, CreateProductRequest>({
            query: (newProduct) => ({
                url: 'products',
                method: 'POST',
                body: newProduct,
            }),
            invalidatesTags: ['Products'], // Автоматически перерисует таблицу
        }),
        deleteProduct: builder.mutation<void, string>({
            query: (id) => ({
                url: `products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Products'],
        }),
        // GET-запрос ZPL-кода этикетки детали для принтера
        getProductLabel: builder.query<{ zplCode: string }, { id: string; size: LabelSizeType }>({
            query: ({ id, size }) => ({
                url: `labels/product/${id}`,
                params: { size },
            }),
        }),
    }),
});

export const {
    useGetProductsQuery,
    useCreateProductMutation,
    useDeleteProductMutation,
    useLazyGetProductLabelQuery
} = productsApi;