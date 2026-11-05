// src/pages/dashboard/stocks/StocksPage.tsx
import { useState } from 'react';
import { useGetStockBalanceQuery } from '@/features/stocks/stocksApi';
import { Layers, Search, Box, Calendar } from 'lucide-react';
import styles from './stocks.module.scss';

export default function StocksPage() {
    const { data: stocks = [], isLoading } = useGetStockBalanceQuery();
    const [searchQuery, setSearchQuery] = useState('');

    // Фильтрация остатков на лету (по артикулу, бренду или адресу ячейки)
    const filteredStocks = stocks.filter((stock) => {
        const query = searchQuery.toLowerCase();
        return (
            stock.productSku.toLowerCase().includes(query) ||
            stock.productBrand.toLowerCase().includes(query) ||
            stock.productName.toLowerCase().includes(query) ||
            stock.cellAddress.toLowerCase().includes(query)
        );
    });

    return (
        <div className={styles.stocksPage}>
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <Layers size={28} />
                    <h2>Онлайн-карта остатков</h2>
                </div>
                <p>Мониторинг адресного баланса, объемов и точного расположения товаров на стеллажах</p>
            </div>

            {/* Фильтр остатков */}
            <div className={styles.filterCard}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Быстрый поиск по артикулу, бренду, названию или ячейке..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* Таблица остатков */}
            <div className={styles.cardTable}>
                <h3>Физическое распределение запасов ({filteredStocks.length})</h3>
                {isLoading ? (
                    <div className={styles.loading}>Загрузка онлайн-баланса склада...</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.wmsTable}>
                            <thead>
                                <tr>
                                    <th>Адрес места</th>
                                    <th>Товар / Номенклатура</th>
                                    <th>Артикул / Бренд</th>
                                    <th>Количество</th>
                                    <th>Последнее движение</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStocks.map((stock) => (
                                    <tr key={stock.id}>
                                        <td className={styles.addressText}>
                                            <div className={styles.cellBadge}>
                                                {stock.cellAddress}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.productBlock}>
                                                <span className={styles.productName}>{stock.productName}</span>
                                            </div>
                                        </td>
                                        <td data-label="Артикул">
                                            <div className={styles.skuBlock}>
                                                <span className={styles.brandText}>{stock.productBrand}</span>
                                                <span className={styles.skuText}>{stock.productSku}</span>
                                            </div>
                                        </td>
                                        <td data-label="Количество">
                                            <div className={styles.quantityBlock}>
                                                <Box size={14} />
                                                <span className={styles.quantityText}>{stock.quantity} шт.</span>
                                            </div>
                                        </td>
                                        <td data-label="Движение">
                                            <div className={styles.dateBlock}>
                                                <Calendar size={14} />
                                                <span>{new Date(stock.updatedAt).toLocaleString('ru-RU')}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStocks.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className={styles.empty}>
                                            На складе нет остатков по указанному фильтру.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}