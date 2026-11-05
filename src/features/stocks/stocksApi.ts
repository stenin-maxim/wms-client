// src/features/stocks/stocksApi.ts
import { baseApi } from '@/api/baseApi';

export interface StockDto {
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    productBrand: string;
    cellId: string;
    cellAddress: string;
    quantity: number;
    updatedAt: string;
}

export const stocksApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Получить онлайн-баланс всех остатков на складе
        getStockBalance: builder.query<StockDto[], void>({
            query: () => 'stocks',
            providesTags: ['Stocks'],
        }),
    }),
});

export const { useGetStockBalanceQuery } = stocksApi;