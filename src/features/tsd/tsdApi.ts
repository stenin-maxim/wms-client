// src/features/tsd/tsdApi.ts
import { baseApi } from '@/api/baseApi';
import { type InvoiceDto } from '@/features/invoices/invoicesApi';
import { type StockDto } from '@/features/stocks/stocksApi';
import { type OrderDto } from '@/features/orders/ordersApi';

export interface TsdScanProductRequest {
    invoiceId: string;
    barcodeOrSku: string;
    quantity: number;
}

export interface TsdPlaceProductRequest {
    productId: string;
    cellId: string;
    quantity: number;
}

export interface TsdPickProductRequest {
    orderId: string;
    cellBarcodeOrAddress: string;
    productBarcodeOrSku: string;
    quantity: number;
}

export const tsdApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Сканирование штрихкода товара на рампе под накладную прихода
        scanProductToInvoice: builder.mutation<InvoiceDto, TsdScanProductRequest>({
            query: ({ invoiceId, barcodeOrSku, quantity }) => ({
                url: `invoices/incoming/${invoiceId}/scan`,
                method: 'POST',
                body: { barcodeOrSku, quantity },
            }),
            invalidatesTags: ['Invoices', 'Stocks'],
        }),
        // Размещение принятого товара в ячейку адресного хранения
        placeProductToCell: builder.mutation<StockDto, TsdPlaceProductRequest>({
            query: (body) => ({
                url: 'stocks/place',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Invoices', 'Stocks'],
        }),
        pickProductFromCell: builder.mutation<OrderDto, TsdPickProductRequest>({
            query: ({ orderId, ...body }) => ({
                url: `orders/outbound/${orderId}/pick`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Stocks'],
        }),
    }),
});

export const { 
    useScanProductToInvoiceMutation,
    usePlaceProductToCellMutation,
    usePickProductFromCellMutation
} = tsdApi;