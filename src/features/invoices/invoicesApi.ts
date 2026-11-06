// src/features/invoices/invoicesApi.ts
import { baseApi } from '@/api/baseApi';

export interface InvoiceItemDto {
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    expectedQuantity: number;
    acceptedQuantity: number;
}

export interface InvoiceDto {
    id: string;
    number: string;
    supplierName: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELED';
    createdAt: string;
    items: InvoiceItemDto[];
}

export interface CreateInvoiceItemRequest {
    productId: string;
    expectedQuantity: number;
}

export interface CreateInvoiceRequest {
    number: string;
    supplierName: string;
    items: CreateInvoiceItemRequest[];
}

export const invoicesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Получить журнал приходных накладных организации
        getInvoices: builder.query<InvoiceDto[], void>({
            query: () => 'invoices/incoming',
            providesTags: ['Invoices'],
        }),
        // Создать накладную ожидания поставки от поставщика
        createInvoice: builder.mutation<InvoiceDto, CreateInvoiceRequest>({
            query: (newInvoice) => ({
                url: 'invoices/incoming',
                method: 'POST',
                body: newInvoice,
            }),
            invalidatesTags: ['Invoices'],
        }),
    }),
});

export const { useGetInvoicesQuery, useCreateInvoiceMutation } = invoicesApi;