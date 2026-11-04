// src/app/AppInitializer.tsx
import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/reduxHooks';
import { useGetMeQuery } from '@/features/auth/authApi';
import { updateUser, logout } from '@/features/auth/authSlice';

interface AppInitializerProps {
    children: React.ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
    const dispatch = useAppDispatch();
    const { token, user } = useAppSelector((state) => state.auth);

    // Запрашиваем профиль /auth/me со Spring Boot только если есть токен, но стор пуст
    const { data: profileData, error, isSuccess } = useGetMeQuery(undefined, {
        skip: !token || !!user,
    });

    useEffect(() => {
        if (isSuccess && profileData) {
            // Восстанавливаем объект пользователя в Redux
            dispatch(updateUser(profileData));
        }
    }, [isSuccess, profileData, dispatch]);

    useEffect(() => {
        if (error) {
            // Если токен протух — мягко очищаем сессию
            dispatch(logout());
        }
    }, [error, dispatch]);

    return <>{children}</>;
}