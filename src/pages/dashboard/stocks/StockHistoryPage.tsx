// src/pages/dashboard/stocks/StockHistoryPage.tsx
import React, { useState } from 'react';
import { useGetStockHistoryQuery, type StockOperationType } from '@/features/stocks/stockHistoryApi';
import { History, Search, ArrowUpRight, ArrowDownLeft, User, MapPin } from 'lucide-react';
import styles from './stockHistory.module.scss';

const OPERATION_LABELS: Record<StockOperationType, { label: string; class: string; icon: React.ReactNode }> = {
    'PLACEMENT': { label: 'Размещение (Приход)', class: styles.placement, icon: <ArrowDownLeft size={14} /> },
    'PICKING': { label: 'Отбор (Расход)', class: styles.picking, icon: <ArrowUpRight size={14} /> },
    'CORRECTION': { label: 'Коррекция остатков', class: styles.correction, icon: <History size={14} /> }
};

export default function StockHistoryPage() {
    const { data: logs = [], isLoading } = useGetStockHistoryQuery();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('ALL');

    // Сквозная фильтрация логов
    const filteredLogs = logs.filter((log) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            log.productSku.toLowerCase().includes(query) ||
            log.productBrand.toLowerCase().includes(query) ||
            log.productName.toLowerCase().includes(query) ||
            log.cellAddress.toLowerCase().includes(query) ||
            log.operatorName.toLowerCase().includes(query);

        const matchesType = selectedType === 'ALL' || log.operationType === selectedType;

        return matchesSearch && matchesType;
    });

    return (
        <div className={styles.historyPage}>
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <History size={28} />
                    <h2>Журналу складского аудита и истории движений</h2>
                </div>
                <p>Логирование действий персонала, движений номенклатуры и сквозной хронологический аудит остатков</p>
            </div>

            {/* Фильтры и поиск */}
            <div className={styles.filterCard}>
                <div className={styles.filterGrid}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Поиск по артикулу, ячейке, названию товара или ФИО кладовщика..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.selectWrapper}>
                        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                            <option value="ALL">Все типы операций</option>
                            <option value="PLACEMENT">Только Размещения (Приход на полку)</option>
                            <option value="PICKING">Только Отборы (Расход с полки)</option>
                            <option value="CORRECTION">Только Коррекции (Инвентаризация)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Лента логов */}
            <div className={styles.cardTable}>
                <h3>История складских транзакций ({filteredLogs.length})</h3>
                {isLoading ? (
                    <div className={styles.loading}>Загрузка журнала аудита...</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.wmsTable}>
                            <thead>
                                <tr>
                                    <th>Дата / Время</th>
                                    <th>Тип операции</th>
                                    <th>Товар / Артикул</th>
                                    <th>Адрес</th>
                                    <th>Количество</th>
                                    <th>Исполнитель</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log) => {
                                    const op = OPERATION_LABELS[log.operationType] || { label: log.operationType, class: '', icon: null };
                                    return (
                                        <tr key={log.id}>
                                            <td className={styles.dateText}>
                                                {new Date(log.createdAt).toLocaleString('ru-RU')}
                                            </td>
                                            <td>
                                                <span className={`${styles.opBadge} ${op.class}`}>
                                                    {op.icon}
                                                    <span>{op.label}</span>
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.productBlock}>
                                                    <span className={styles.productName}>{log.productName}</span>
                                                    <span className={styles.productSku}>{log.productBrand} · {log.productSku}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.cellBlock}>
                                                    <MapPin size={14} />
                                                    <span>{log.cellAddress}</span>
                                                </div>
                                            </td>
                                            <td data-label="Количество" className={styles.quantityText}>
                                                {log.operationType === 'PICKING' ? '-' : '+'}{log.quantity} шт.
                                            </td>
                                            <td>
                                                <div className={styles.operatorBlock}>
                                                    <User size={14} />
                                                    <span>{log.operatorName}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={styles.empty}>
                                            Записи движений по указанному фильтру отсутствуют.
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