import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
    reducerPath: 'api',
    // Централизованная настройка базового URL и заголовков
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('wms_auth_token');
            if (token) {
                // Автоматически добавляем токен авторизации компании к каждому запросу
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    // Глобальный список тегов для автоматического обновления данных склада
    tagTypes: ['Auth', 'Products', 'Cells', 'Stocks', 'Invoices'],
    // На верхнем уровне endpoints оставляем пустым
    endpoints: () => ({}),
});