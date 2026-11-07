import { useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { logout } from '@/features/auth/authSlice';
import { 
    Package, 
    LayoutDashboard, 
    Wrench, 
    Boxes, 
    Users, 
    LogOut,
    Layers,
    History,
    FileText,
    ShoppingCart
} from 'lucide-react';
import { ROLE_LABELS } from '@/shared/constants/roles';
import styles from './dashboard.module.scss';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    if (!user) {
        return (
            <div className={styles.loaderContainer}>
                <div className={styles.spinner}>Загрузка данных склада...</div>
            </div>
        );
    }

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login', { replace: true });
    };

    const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
        `${styles.navLink} ${isActive ? styles.active : ''}`;

    return (
        <div className={styles.layoutContainer}>
            
            {/* БОКОВОЕ МЕНЮ (SIDEBAR) */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Package className={styles.logoIcon} size={24} />
                    <span className={styles.logoText}>
                        {import.meta.env.VITE_APP_NAME || 'WMS'}
                    </span>
                </div>

                <nav className={styles.navigation}>
                    {/* АНАЛИТИКА */}
                    <div className={styles.navGroupTitle}>Аналитика склада</div>
                    <NavLink to="/dashboard" end className={getNavLinkClass}>
                        <LayoutDashboard size={18} />
                        <span className={styles.navText}>Главная статистика</span>
                    </NavLink>
                    
                    <NavLink to="/dashboard/stocks" className={getNavLinkClass}>
                        <Layers size={18} />
                        <span className={styles.navText}>Карта остатков</span>
                    </NavLink>

                    <NavLink to="/dashboard/history" className={getNavLinkClass}>
                        <History size={18} />
                        <span className={styles.navText}>Журнал аудита</span>
                    </NavLink>

                    {/* ДОКУМЕНТЫ */}
                    <div className={styles.navGroupTitle}>Документы склада</div>
                    <NavLink to="/dashboard/invoices" className={getNavLinkClass}>
                        <FileText size={18} />
                        <span className={styles.navText}>Поступления</span>
                    </NavLink>
                    
                    <NavLink to="/dashboard/orders" className={getNavLinkClass}>
                        <ShoppingCart size={18} />
                        <span className={styles.navText}>Отгрузки</span>
                    </NavLink>

                    {/* НОМЕНКЛАТУРА И ТОПОЛОГИЯ */}
                    <div className={styles.navGroupTitle}>Инфраструктура</div>
                    <NavLink to="/dashboard/products" className={getNavLinkClass}>
                        <Wrench size={18} />
                        <span className={styles.navText}>Номенклатура товаров</span>
                    </NavLink>
                    
                    <NavLink to="/dashboard/cells" className={getNavLinkClass}>
                        <Boxes size={18} />
                        <span className={styles.navText}>Ячейки хранения</span>
                    </NavLink>

                    {/* ПЕРСОНАЛ */}
                    <div className={styles.navGroupTitle}>Ресурсы</div>
                    <NavLink to="/dashboard/employees" className={getNavLinkClass}>
                        <Users size={18} />
                        <span className={styles.navText}>Учет сотрудников</span>
                    </NavLink>
                </nav>
                
                <div className={styles.sidebarFooter}>v1.0.0 Alpha</div>
            </aside>

            {/* ПРАВАЯ РАБОЧАЯ ОБЛАСТЬ */}
            <div className={styles.mainWrapper}>
                
               <header className={styles.header}>
                    <div className={styles.companyInfo}>
                        <h1>{user.companyName}</h1>
                        <span className={styles.badge}>SaaS Изоляция</span>
                    </div>

                    <div className={styles.userControl}>
                        <div className={styles.profileCard}>
                            <span className={styles.userName}>{user.name}</span>
                            <span className={styles.userRole}>
                                {ROLE_LABELS[user.role] || user.role}
                            </span>
                        </div>
                        
                        <button onClick={handleLogout} className={styles.logoutBtn}>
                            <LogOut size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            <span>Выйти</span>
                        </button>
                    </div>
                </header>

                {/* ОСНОВНАЯ ЗОНА ВЫВОДА ДАННЫХ */}
                <main className={styles.contentArea}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}