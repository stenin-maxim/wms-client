import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from '@/pages/landing/LandingPage';
import LoginPage from '@/pages/auth/login/LoginPage';
import RegisterPage from '@/pages/auth/register/RegisterPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout'; 
import CellsPage from '@/pages/dashboard/cells/CellsPage';
import EmployeesPage from '@/pages/dashboard/employees/EmployeesPage';
import ProductsPage from '@/pages/dashboard/products/ProductsPage';
import StocksPage from '@/pages/dashboard/stocks/StocksPage';
import StockHistoryPage from '@/pages/dashboard/stocks/StockHistoryPage';
import InvoicesPage from '@/pages/dashboard/invoices/InvoicesPage';
import OrdersPage from '@/pages/dashboard/orders/OrdersPage';

// Заглушки для будущих страниц и лейаутов, чтобы роутер не выдавал ошибки
const DashboardHome = () => <h2 style={{ color: '#fff' }}>📊 Сводная аналитика заполняемости склада</h2>;
const TsdScanPage = () => <div style={{ padding: '2rem', color: '#fff' }}>Интерфейс ТСД: Сканирование автозапчастей</div>;

const TsdLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="tsd-layout" style={{ maxWidth: '450px', margin: '0 auto', background: '#0f172a', minHeight: '100vh' }}>
        <header style={{ background: '#1e293b', padding: '1rem', textAlign: 'center', borderBottom: '2px solid #f59e0b' }}>
            <span>ТСД Режим</span>
        </header>
        {children}
    </div>
);

export const router = createBrowserRouter([
    {
        path: '/',
        element: <LandingPage />
    },
    {
        path: '/login',
        element: <LoginPage />
    },
    {
        path: '/register',
        element: <RegisterPage />
    },

    // Группа страниц личного кабинета под единым DashboardLayout
    {
        path: '/dashboard',
        // Защищаем и оборачиваем в Layout всю ветку маршрутов целиком
        element: (
            <ProtectedRoute allowedRoles={['ADMIN', 'STOREKEEPER']}>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        // Все дочерние пути пишутся относительно родительского /dashboard
        children: [
            {
                path: '',
                element: <DashboardHome />
            },
            {
                path: 'products',
                element: <ProductsPage />
            },
            {
                path: 'cells',
                element: <CellsPage />
            },
            {
                path: 'employees',
                element: <EmployeesPage />
            },
            {
                path: 'stocks',
                element: <StocksPage />
            },
            {
                path: 'history',
                element: <StockHistoryPage />
            },
            {
                path: 'invoices',
                element: <InvoicesPage />
            },
            {
                path: 'orders',
                element: <OrdersPage />
            }
        ]
    },
    // Маршруты Терминала Сбора Данных (для ТСД кладовщиков)
    {
        path: '/tsd/scan',
        element: (
            <ProtectedRoute allowedRoles={['ADMIN', 'STOREKEEPER', 'PICKER']}>
                <TsdLayout>
                    <TsdScanPage />
                </TsdLayout>
            </ProtectedRoute>
        )
    },

    {
        path: '*',
        element: <Navigate to="/" replace />
    }
]);