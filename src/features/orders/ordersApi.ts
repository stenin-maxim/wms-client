// src/features/orders/ordersApi.ts
import { baseApi } from '@/api/baseApi';

export interface OrderItemDto {
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    productBrand: string;
    expectedQuantity: number;
    pickedQuantity: number;
}

export interface OrderDto {
    id: string;
    orderNumber: string;
    customerName: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELED';
    createdAt: string;
    items: OrderItemDto[];
}

export interface CreateOrderItemRequest {
    productId: string;
    expectedQuantity: number;
}

export interface CreateOrderRequest {
    orderNumber: string;
    customerName: string;
    items: CreateOrderItemRequest[];
}

export const ordersApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Получить журнал расходных заказов организации
        getOrders: builder.query<OrderDto[], void>({
            query: () => 'orders/outbound',
            providesTags: ['Stocks'],
        }),
        // Создать новый заказ на сборку и отгрузку товаров
        createOrder: builder.mutation<OrderDto, CreateOrderRequest>({
            query: (newOrder) => ({
                url: 'orders/outbound',
                method: 'POST',
                body: newOrder,
            }),
            invalidatesTags: ['Stocks'],
        }),
    }),
});

export const { useGetOrdersQuery, useCreateOrderMutation } = ordersApi;