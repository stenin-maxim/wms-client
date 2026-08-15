import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
    reducerPath: 'api',
    // 1. Централизованная настройка базового URL и заголовков
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
    // 2. Глобальный список тегов для автоматического обновления данных склада
    tagTypes: ['Auth', 'Parts', 'Cells', 'Stocks'],
    // На верхнем уровне endpoints оставляем пустым
    endpoints: () => ({}),
});