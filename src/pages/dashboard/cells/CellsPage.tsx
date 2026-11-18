// src/pages/dashboard/cells/CellsPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    useGetCellsQuery, 
    useCreateCellMutation, 
    useToggleCellBlockMutation,
    useLazyGetCellLabelQuery 
} from '@/features/cells/cellsApi';
import { useGetStockBalanceQuery } from '@/features/stocks/stocksApi';
import { Boxes, Plus, ShieldAlert, ShieldCheck, Printer, Eye } from 'lucide-react';
import { downloadZplFile } from '@/shared/utils/downloadZpl';
import { type LabelSizeType } from '@/shared/constants/labels';
import { LabelSizeSelector } from '@/shared/ui/LabelSizeSelector/LabelSizeSelector';
import styles from './cells.module.scss';

export default function CellsPage() {
    // Подключаем RTK Query хуки
    const { data: cells = [], isLoading } = useGetCellsQuery();
    const [createCell, { isLoading: isCreating }] = useCreateCellMutation();
    const [toggleBlock] = useToggleCellBlockMutation();
    const [triggerGetLabel] = useLazyGetCellLabelQuery();
    const { data: stocks = [] } = useGetStockBalanceQuery();

    // Стейты формы
    const [zoneName, setZoneName] = useState('');
    const [rack, setRack] = useState('');
    const [shelf, setShelf] = useState('');
    const [position, setPosition] = useState('');
    const [formError, setFormError] = useState('');
    const [labelSize, setLabelSize] = useState<LabelSizeType>('SIZE_58X40');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // Фронтенд-валидация: проверяем strict-формат, который требует бэкенд Java 25
        if (!/^[A-Z0-9]+$/.test(zoneName.toUpperCase())) {
            setFormError('Имя зоны должно содержать только латинские буквы и цифры');
            return;
        }
        if (!/^\d{2}$/.test(rack) || !/^\d{2}$/.test(shelf) || !/^\d{2}$/.test(position)) {
            setFormError('Стеллаж, ярус и позиция должны состоять ровно из 2 цифр (например: 01, 05)');
            return;
        }

        try {
            await createCell({
                zoneName: zoneName.toUpperCase().trim(),
                rack: rack.trim(),
                shelf: shelf.trim(),
                position: position.trim()
            }).unwrap();

            // Очищаем форму при успехе
            setZoneName('');
            setRack('');
            setShelf('');
            setPosition('');
        } catch (err: any) {
            setFormError(err?.data?.message || 'Ошибка создания ячейки');
        }
    };

    // Вспомогательная функция подсчета товаров в конкретной ячейке
    const getCellStockSummary = (cellId: string) => {
        const cellStocks = stocks.filter((s) => s.cellId === cellId && s.quantity > 0);
        const totalQty = cellStocks.reduce((sum, item) => sum + item.quantity, 0);
        return { skuCount: cellStocks.length, totalQty };
    };

    const handleToggleBlock = async (id: string, currentStatus: boolean) => {
        try {
            await toggleBlock({ id, isBlocked: !currentStatus }).unwrap();
        } catch (err) {
            console.error('Не удалось изменить статус ячейки', err);
        }
    };

    const handlePrintLabel = async (id: string, address: string) => {
        try {
            const res = await triggerGetLabel({ id, size: labelSize }).unwrap();
            downloadZplFile(res.zplCode, `label_cell_${address}_${labelSize}`);
        } catch (err) {
            alert('Не удалось получить код этикетки');
        }
    };

    return (
        <div className={styles.cellsPage}>
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <Boxes size={28} />
                    <h2>Топология и адресные ячейки</h2>
                </div>
                <p>Управление физической картой стеллажей и лотков адресного хранения</p>
            </div>

            <div className={styles.dashboardGrid}>
                {/* ЛЕВАЯ ЧАСТЬ: Форма создания */}
                <div className={styles.card}>
                    <h3>Добавить новую ячейку</h3>
                    <form onSubmit={handleCreate} className={styles.cellForm}>
                        {formError && <div className={styles.errorMsg}>{formError}</div>}
                        
                        <div className={styles.formGroup}>
                            <label>Зона (Буква/Имя)</label>
                            <input 
                                type="text" required maxLength={5} placeholder="A"
                                value={zoneName} onChange={(e) => setZoneName(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Стеллаж (01-99)</label>
                                <input 
                                    type="text" required maxLength={2} placeholder="01"
                                    value={rack} onChange={(e) => setRack(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Ярус/Полка (01-99)</label>
                                <input 
                                    type="text" required maxLength={2} placeholder="02"
                                    value={shelf} onChange={(e) => setShelf(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Позиция (01-99)</label>
                                <input 
                                    type="text" required maxLength={2} placeholder="05"
                                    value={position} onChange={(e) => setPosition(e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isCreating} className={styles.addBtn}>
                            <Plus size={18} />
                            <span>{isCreating ? 'Сохранение...' : 'Создать координату'}</span>
                        </button>
                    </form>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: Таблица ячеек */}
                <div className={styles.cardTable}>
                    <div className={styles.tableHeaderRow}>
                        <h3>Активные места хранения ({cells.length})</h3>
                        <LabelSizeSelector value={labelSize} onChange={setLabelSize} />
                    </div>
                    {isLoading ? (
                        <div className={styles.loading}>Загрузка карты стеллажей...</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.wmsTable}>
                                <thead>
                                    <tr>
                                        <th>Адрес ячейки</th>
                                        <th>Зона</th>
                                        <th>Штрихкод ТСД</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cells.map((cell) => {
                                        const { skuCount, totalQty } = getCellStockSummary(cell.id);

                                        return (
                                            <tr key={cell.id} className={cell.blocked ? styles.rowBlocked : ''}>
                                                <td className={styles.addressText} data-label="Адрес ячейки">
                                                    <Link to={`/dashboard/cells/${cell.id}`} className={styles.addressLink}>
                                                        {cell.address}
                                                    </Link>
                                                    {totalQty > 0 ? (
                                                        <span className={styles.stockCounterBadge}>
                                                            {skuCount} поз. ({totalQty} шт.)
                                                        </span>
                                                    ) : (
                                                        <span className={styles.emptyCellBadge}>Пусто</span>
                                                    )}
                                                </td>
                                                <td data-label="Зона">
                                                    Зона {cell.zoneName}
                                                </td>
                                                <td className={styles.code} data-label="Штрихкод ТСД">
                                                    {cell.barcode ? cell.barcode.replace(/^CELL-([A-Z0-9]+)([0-9]{2})([0-9]{2})([0-9]{2})$/, 'CELL-$1 $2 $3 $4') : cell.barcode}
                                                </td>
                                                <td data-label="Статус">
                                                    {cell.blocked ? (
                                                        <span className={`${styles.statusBadge} ${styles.blocked}`}>Заблокирована</span>
                                                    ) : (
                                                        <span className={`${styles.statusBadge} ${styles.active}`}>Доступна</span>
                                                    )}
                                                </td>
                                                <td className={styles.actions} data-label="Действия">
                                                    <Link
                                                        to={`/dashboard/cells/${cell.id}`}
                                                        className={`${styles.actionBtn} ${styles.view}`}
                                                        title="Открыть содержимое ячейки"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleToggleBlock(cell.id, cell.blocked)}
                                                        className={`${styles.actionBtn} ${cell.blocked ? styles.unblock : styles.block}`}
                                                        title={cell.blocked ? "Разблокировать" : "Заблокировать для ремонта"}
                                                    >
                                                        {cell.blocked ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrintLabel(cell.id, cell.address)}
                                                        className={`${styles.actionBtn} ${styles.print}`}
                                                        title="Скачать ZPL этикетку"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {cells.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className={styles.empty}>Топология склада пуста. Добавьте первый стеллаж.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}