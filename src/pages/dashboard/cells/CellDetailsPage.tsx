// src/pages/dashboard/cells/CellDetailsPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useGetCellsQuery,
    useToggleCellBlockMutation,
    useLazyGetCellLabelQuery
} from '@/features/cells/cellsApi';
import { useGetStockBalanceQuery } from '@/features/stocks/stocksApi';
import { useGetStockHistoryQuery } from '@/features/stocks/stockHistoryApi';
import { downloadZplFile } from '@/shared/utils/downloadZpl';
import {
    ArrowLeft,
    Boxes,
    Package,
    Printer,
    ShieldAlert,
    ShieldCheck,
    History
} from 'lucide-react';
import { type LabelSizeType } from '@/shared/constants/labels';
import { LabelSizeSelector } from '@/shared/ui/LabelSizeSelector/LabelSizeSelector';
import styles from './cellDetails.module.scss';

export default function CellDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [labelSize, setLabelSize] = useState<LabelSizeType>('SIZE_58X40');

    const { data: cells = [], isLoading: isLoadingCells } = useGetCellsQuery();
    const { data: stocks = [], isLoading: isLoadingStocks } = useGetStockBalanceQuery();
    const { data: history = [] } = useGetStockHistoryQuery();

    const [toggleBlock] = useToggleCellBlockMutation();
    const [triggerGetLabel] = useLazyGetCellLabelQuery();

    const cell = cells.find((c) => c.id === id);
    const cellStocks = stocks.filter((s) => s.cellId === id && s.quantity > 0);
    const cellHistory = history.filter((h) => h.cellId === id).slice(0, 10);

    const handleToggleBlock = async () => {
        if (!cell) return;
        try {
            await toggleBlock({ id: cell.id, isBlocked: !cell.blocked }).unwrap();
        } catch (err) {
            console.error('Ошибка смены статуса ячейки', err);
        }
    };

    const handlePrintLabel = async () => {
        if (!cell) return;
        try {
            const res = await triggerGetLabel({ id: cell.id, size: labelSize }).unwrap();
            downloadZplFile(res.zplCode, `label_cell_${cell.address}_${labelSize}`);
        } catch (err) {
            alert('Не удалось получить код этикетки');
        }
    };

    if (isLoadingCells || isLoadingStocks) {
        return <div className={styles.loading}>Загрузка паспорта ячейки...</div>;
    }

    if (!cell) {
        return (
            <div className={styles.notFound}>
                <h3>Ячейка не найдена</h3>
                <button onClick={() => navigate('/dashboard/cells')} className={styles.backBtn}>
                    <ArrowLeft size={16} />
                    <span>Вернуться к карте ячеек</span>
                </button>
            </div>
        );
    }

    const totalItemsCount = cellStocks.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className={styles.detailsPage}>
            <button onClick={() => navigate('/dashboard/cells')} className={styles.backBtn}>
                <ArrowLeft size={16} />
                <span>Назад к списку ячеек</span>
            </button>

            {/* ШАПКА ЯЧЕЙКИ */}
            <div className={styles.headerCard}>
                <div className={styles.headerInfo}>
                    <div className={styles.titleRow}>
                        <Boxes size={28} className={styles.amberIcon} />
                        <h2>Ячейка {cell.address}</h2>
                        {cell.blocked ? (
                            <span className={`${styles.statusBadge} ${styles.blocked}`}>Заблокирована</span>
                        ) : (
                            <span className={`${styles.statusBadge} ${styles.active}`}>Доступна</span>
                        )}
                    </div>

                    <div className={styles.metaRow}>
                        <span>Зона: <strong>{cell.zoneName}</strong></span>
                        <span>Стеллаж: <strong>{cell.rack}</strong></span>
                        <span>Ярус: <strong>{cell.shelf}</strong></span>
                        <span>Позиция: <strong>{cell.position}</strong></span>
                        <span>
                            Штрихкод ТСД:{' '}
                            <code className={styles.code}>
                                {cell.barcode.replace(/^CELL-([A-Z0-9]+)([0-9]{2})([0-9]{2})([0-9]{2})$/, 'CELL-$1 $2 $3 $4')}
                            </code>
                        </span>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <LabelSizeSelector value={labelSize} onChange={setLabelSize} />
                    <button onClick={handlePrintLabel} className={styles.secondaryBtn}>
                        <Printer size={16} />
                        <span>Печать ZPL</span>
                    </button>
                    <button
                        onClick={handleToggleBlock}
                        className={`${styles.secondaryBtn} ${cell.blocked ? styles.unblockBtn : styles.blockBtn}`}
                    >
                        {cell.blocked ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                        <span>{cell.blocked ? 'Разблокировать' : 'Заблокировать'}</span>
                    </button>
                </div>
            </div>

            {/* СОДЕРЖИМОЕ ЯЧЕЙКИ */}
            <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                    <h3>
                        <Package size={18} />
                        <span>Товары в ячейке ({cellStocks.length} поз. / {totalItemsCount} шт.)</span>
                    </h3>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.wmsTable}>
                        <thead>
                            <tr>
                                <th>Бренд</th>
                                <th>Артикул (SKU)</th>
                                <th>Наименование товара</th>
                                <th>Остаток в ячейке</th>
                                <th>Обновлено</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cellStocks.map((stock) => (
                                <tr key={stock.id}>
                                    <td data-label="Бренд" className={styles.brandText}>
                                        {stock.productBrand}
                                    </td>
                                    <td data-label="Артикул" className={styles.skuText}>
                                        {stock.productSku}
                                    </td>
                                    <td data-label="Наименование" className={styles.nameText}>
                                        {stock.productName}
                                    </td>
                                    <td data-label="Остаток">
                                        <span className={styles.qtyBadge}>{stock.quantity} шт.</span>
                                    </td>
                                    <td data-label="Обновлено" className={styles.dateText}>
                                        {new Date(stock.updatedAt).toLocaleString('ru-RU')}
                                    </td>
                                </tr>
                            ))}
                            {cellStocks.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={styles.empty}>
                                        В данной ячейке сейчас нет товаров. Она полностью свободна для размещения.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ИСТОРИЯ ОПЕРАЦИЙ ПО ЯЧЕЙКЕ */}
            <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                    <h3>
                        <History size={18} />
                        <span>Последние движения по ячейке</span>
                    </h3>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.wmsTable}>
                        <thead>
                            <tr>
                                <th>Дата и время</th>
                                <th>Операция</th>
                                <th>Товар</th>
                                <th>Количество</th>
                                <th>Сотрудник</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cellHistory.map((log) => (
                                <tr key={log.id}>
                                    <td data-label="Дата" className={styles.dateText}>
                                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                                    </td>
                                    <td data-label="Операция">
                                        {log.operationType === 'PICKING' ? 'Отбор (Расход)' : 'Размещение (Приход)'}
                                    </td>
                                    <td data-label="Товар">
                                        {log.productBrand} · {log.productSku} ({log.productName})
                                    </td>
                                    <td data-label="Количество" className={log.operationType === 'PICKING' ? styles.textRed : styles.textGreen}>
                                        {log.operationType === 'PICKING' ? '-' : '+'}{log.quantity} шт.
                                    </td>
                                    <td data-label="Сотрудник">
                                        {log.operatorName}
                                    </td>
                                </tr>
                            ))}
                            {cellHistory.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={styles.empty}>
                                        История операций по этой ячейке пуста.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}