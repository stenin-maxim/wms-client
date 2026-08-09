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
    }),
});

// RTK Query автоматически сгенерирует хук, привязанный к общему стору
export const { useLoginMutation } = authApi;