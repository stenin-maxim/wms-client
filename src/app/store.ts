import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/api/baseApi'; // Импортируем единый базовый API слоя

export const store = configureStore({
    reducer: {
        // Подключаем единый автоматический редюсер для всех сетевых запросов приложения
        [baseApi.reducerPath]: baseApi.reducer,
    },
    // Подключаем middleware базового API для управления кэшированием и инвалидацией тегов
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
});

// Типизация для использования в приложении
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;