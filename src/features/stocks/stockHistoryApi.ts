// src/features/stocks/stockHistoryApi.ts
import { baseApi } from '@/api/baseApi';

export type StockOperationType = 'PLACEMENT' | 'PICKING' | 'CORRECTION';

export interface StockHistoryDto {
    id: string;
    operationType: StockOperationType;
    productId: string;
    productName: string;
    productSku: string;
    productBrand: string;
    cellId: string;
    cellAddress: string;
    quantity: number;
    operatorName: string;
    createdAt: string;
}

export const stockHistoryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Получить хронологический журнал складского аудита
        getStockHistory: builder.query<StockHistoryDto[], void>({
            query: () => 'stocks/history',
            providesTags: ['Stocks'],
        }),
    }),
});

export const { useGetStockHistoryQuery } = stockHistoryApi;