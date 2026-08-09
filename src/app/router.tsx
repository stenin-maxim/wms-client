import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';

// Заглушки для будущих страниц и лейаутов, чтобы роутер не выдавал ошибки
const RegisterPage = () => <div style={{ padding: '2rem' }}>Страница регистрации компании</div>;
const DashboardPage = () => <div style={{ padding: '2rem' }}>Главный дашборд (Статистика склада)</div>;
const TsdScanPage = () => <div style={{ padding: '2rem' }}>Интерфейс ТСД: Сканирование автозапчастей</div>;

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="dashboard-layout">
        <aside style={{ width: '250px', background: '#1e293b', padding: '1rem', height: '100vh', float: 'left' }}>
            <h3 style={{ color: '#f59e0b' }}>WMS Панель</h3>
        </aside>
        <main style={{ marginLeft: '250px', padding: '2rem' }}>{children}</main>
    </div>
);

const TsdLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="tsd-layout" style={{ maxWidth: '450px', margin: '0 auto', background: '#0f172a', minHeight: '100vh' }}>
        <header style={{ background: '#1e293b', padding: '1rem', textAlign: 'center', borderBottom: '2px solid #f59e0b' }}>
            <span>ТСД Режим</span>
        </header>
        {children}
    </div>
);

export const router = createBrowserRouter([
    // 1. Публичные маршруты (Авторизация)
    {
        path: '/login',
        element: <LoginPage />
    },
    {
        path: '/register',
        element: <RegisterPage />
    },

    // 2. Маршруты Личного Кабинета компании (для ПК)
    {
        path: '/dashboard',
        element: (
            <DashboardLayout>
                <DashboardPage />
            </DashboardLayout>
        )
    },

    // 3. Маршруты Терминала Сбора Данных (для ТСД кладовщиков)
    {
        path: '/tsd/scan',
        element: (
            <TsdLayout>
                <TsdScanPage />
            </TsdLayout>
        )
    },

    // 4. Перенаправление со всех неизвестных страниц на логин
    {
        path: '*',
        element: <Navigate to="/login" replace />
    }
]);