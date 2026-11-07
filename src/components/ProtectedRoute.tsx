import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/reduxHooks';

interface ProtectedRouteProps {
    children: React.ReactElement;
    // Массив разрешенных ролей для этой страницы (необязательно)
    allowedRoles?: ('SUPER_ADMIN' | 'ADMIN' | 'AUDITOR' | 'MANAGER' | 'STOREKEEPER' | 'PICKER')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const location = useLocation();

    // 1. Если пользователь не авторизован, отправляем на страницу входа.
    // Сохраняем текущий URL (state: { from: location }), чтобы вернуть пользователя сюда после успешного логина.
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Если у страницы есть ограничения по ролям, проверяем роль сотрудника
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        if (user.role === 'PICKER') {
            return <Navigate to="/tsd/scan" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    // Если все проверки пройдены, рендерим защищенный компонент
    return children;
}