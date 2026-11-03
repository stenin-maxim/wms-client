// src/features/auth/authApi.js
import { baseApi } from '@/api/baseApi'; // Импортируем наш глобальный API

// Расширяем глобальный API эндпоинтами для логина/регистрации
export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: 'auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['Auth'], // Сбрасываем тег авторизации при входе
        }),
        register: builder.mutation({
            query: (companyData) => ({
                url: 'auth/register',
                method: 'POST',
                body: companyData,
            }),
            invalidatesTags: ['Auth'],
        }),
    }),
});

// RTK Query автоматически сгенерирует хук, привязанный к общему стору
export const { useLoginMutation, useRegisterMutation } = authApi;