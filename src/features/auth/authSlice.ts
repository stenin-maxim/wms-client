// src/features/auth/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'STOREKEEPER' | 'PICKER'; 
    companyId: string;
    companyName: string;
}

interface AuthState {
    user: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
}

const TOKEN_KEY = 'wms_auth_token';

// Пытаемся безопасно достать токен из localStorage при инициализации приложения
const initialToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

const initialState: AuthState = {
    user: null,
    token: initialToken,
    isAuthenticated: !!initialToken,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Установка данных сессии после успешного входа/регистрации
        setCredentials: (
            state,
            action: PayloadAction<{ user: UserProfile; token: string }>
        ) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            
            localStorage.setItem(TOKEN_KEY, token);
        },
        // Выход из системы с полной очисткой данных
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            
            localStorage.removeItem(TOKEN_KEY);
        },
        updateUser: (state, action: PayloadAction<UserProfile>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
    },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;