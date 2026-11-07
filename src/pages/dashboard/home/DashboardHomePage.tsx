// src/pages/dashboard/home/DashboardHomePage.tsx
import { useGetProductsQuery } from '@/features/products/productsApi';
import { useGetCellsQuery } from '@/features/cells/cellsApi';
import { useGetInvoicesQuery } from '@/features/invoices/invoicesApi';
import { useGetOrdersQuery } from '@/features/orders/ordersApi';
import { useGetStockBalanceQuery } from '@/features/stocks/stocksApi';
import { useGetStockHistoryQuery } from '@/features/stocks/stockHistoryApi';
import { 
    LayoutDashboard, 
    Package, 
    Boxes, 
    FileText, 
    ShoppingCart, 
    TrendingUp, 
    Clock 
} from 'lucide-react';
import styles from './dashboardHome.module.scss';

export default function DashboardHomePage() {
    // Подтягиваем данные из кэша RTK Query для сквозного подсчета статистики
    const { data: products = [], isLoading: isLoadingProd } = useGetProductsQuery();
    const { data: cells = [], isLoading: isLoadingCells } = useGetCellsQuery();
    const { data: invoices = [] } = useGetInvoicesQuery();
    const { data: orders = [] } = useGetOrdersQuery();
    const { data: stocks = [] } = useGetStockBalanceQuery();
    const { data: logs = [] } = useGetStockHistoryQuery();

    const isLoading = isLoadingProd || isLoadingCells;

    // Вычисляем показатели заполняемости и активности
    const totalPositions = products.length;
    const totalCells = cells.length;
    const blockedCells = cells.filter(c => c.blocked).length;
    
    // Считаем сколько уникальных ячеек сейчас физически занято товаром
    const occupiedCellsCount = new Set(stocks.map(s => s.cellId)).size;
    const occupancyRate = totalCells > 0 ? Math.round((occupiedCellsCount / totalCells) * 100) : 0;

    const activeInvoices = invoices.filter(i => i.status === 'PENDING' || i.status === 'PROCESSING').length;
    const activeOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;

    // Берем топ-5 последних записей для экспресс-ленты
    const recentLogs = logs.slice(0, 5);

    if (isLoading) {
        return <div className={styles.loading}>Расчет операционных показателей WMS...</div>;
    }

    return (
        <div className={styles.homePage}>
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <LayoutDashboard size={28} />
                    <h2>Сводная аналитика заполняемости склада</h2>
                </div>
                <p>Оперативный мониторинг емкости, плотности хранения и загруженности рабочих зон</p>
            </div>

            {/* СЕТКА АНАЛИТИЧЕСКИХ ВИДЖЕТОВ (KPI CARDS) */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={`${styles.iconWrapper} ${styles.blue}`}>
                        <Package size={22} />
                    </div>
                    <div className={styles.kpiData}>
                        <span className={styles.kpiTitle}>Номенклатура</span>
                        <span className={styles.kpiValue}>{totalPositions}</span>
                        <span className={styles.kpiSub}>активных товаров</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={`${styles.iconWrapper} ${styles.amber}`}>
                        <Boxes size={22} />
                    </div>
                    <div className={styles.kpiData}>
                        <span className={styles.kpiTitle}>Заполненность</span>
                        <span className={styles.kpiValue}>{occupancyRate}%</span>
                        <span className={styles.kpiSub}>
                            {occupiedCellsCount} из {totalCells} ячеек
                        </span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={`${styles.iconWrapper} ${styles.green}`}>
                        <FileText size={22} />
                    </div>
                    <div className={styles.kpiData}>
                        <span className={styles.kpiTitle}>Приёмка</span>
                        <span className={styles.kpiValue}>{activeInvoices}</span>
                        <span className={styles.kpiSub}>активных накладных</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={`${styles.iconWrapper} ${styles.red}`}>
                        <ShoppingCart size={22} />
                    </div>
                    <div className={styles.kpiData}>
                        <span className={styles.kpiTitle}>Отгрузка</span>
                        <span className={styles.kpiValue}>{activeOrders}</span>
                        <span className={styles.kpiSub}>заказов на сборку</span>
                    </div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* БЛОК А: ЕМКОСТЬ И ЗОНЫ СТРУКТУРЫ */}
                <div className={styles.analyticsBlock}>
                    <h3><TrendingUp size={18} style={{ marginRight: '8px' }} /> Сводный баланс зон</h3>
                    <div className={styles.progressSection}>
                        <div className={styles.progressHeader}>
                            <span>Плотность адресного хранения</span>
                            <span>{occupancyRate}%</span>
                        </div>
                        <div className={styles.progressBarWrapper}>
                            <div 
                                className={styles.progressBar} 
                                style={{ width: `${occupancyRate}%` }}
                            />
                        </div>
                    </div>
                    
                    <div className={styles.metaStatsList}>
                        <div className={styles.metaRow}>
                            <span>Свободно ячеек под раскладку:</span>
                            <span className={styles.textSuccess}>{totalCells - occupiedCellsCount - blockedCells} шт.</span>
                        </div>
                        <div className={styles.metaRow}>
                            <span>Заблокировано для ремонта/инвентаря:</span>
                            <span className={styles.textError}>{blockedCells} шт.</span>
                        </div>
                    </div>
                </div>

                {/* БЛОК Б: ОПЕРАТИВНАЯ ЛЕНТА ДЕЙСТВИЙ */}
                <div className={styles.analyticsBlock}>
                    <h3><Clock size={18} style={{ marginRight: '8px' }} /> Живая лента транзакций</h3>
                    <div className={styles.timeline}>
                        {recentLogs.map((log) => (
                            <div key={log.id} className={styles.timelineItem}>
                                <div className={`${styles.timelineDot} ${log.operationType === 'PICKING' ? styles.dotRed : styles.dotGreen}`} />
                                <div className={styles.timelineContent}>
                                    <div className={styles.timelineMeta}>
                                        <span className={styles.timelineTime}>{log.createdAt ? new Date(log.createdAt).toLocaleString('ru-RU') : ''}</span>
                                        <span className={styles.timelineUser}>{log.operatorName}</span>
                                    </div>
                                    <p className={styles.timelineText}>
                                        {log.operationType === 'PICKING' ? 'Отобрано' : 'Размещено'}{' '}
                                        <strong>{log.quantity} шт.</strong> товара {log.productBrand} ({log.productSku}) в ячейку{' '}
                                        <strong>{log.cellAddress}</strong>
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentLogs.length === 0 && (
                            <div className={styles.emptyLogs}>На складе пока не зафиксировано движений.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}