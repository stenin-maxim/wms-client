// src/features/tsd/tsdApi.ts
import { baseApi } from '@/api/baseApi';
import { type InvoiceDto } from '@/features/invoices/invoicesApi';
import { type StockDto } from '@/features/stocks/stocksApi';

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

export const tsdApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Сканирование штрихкода товара на рампе под накладную прихода
        scanProductToInvoice: builder.mutation<InvoiceDto, TsdScanProductRequest>({
            query: ({ invoiceId, barcodeOrSku, quantity }) => ({
                url: `invoices/incoming/${invoiceId}/scan`,
                method: 'POST',
                params: { barcodeOrSku, quantity }, // Передача через RequestParam
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
    }),
});

export const { 
    useScanProductToInvoiceMutation,
    usePlaceProductToCellMutation 
} = tsdApi;