// src/pages/dashboard/CellsPage.tsx
import React, { useState } from 'react';
import { 
    useGetCellsQuery, 
    useCreateCellMutation, 
    useToggleCellBlockMutation,
    useLazyGetCellLabelQuery 
} from '@/features/cells/cellsApi';
import { Boxes, Plus, ShieldAlert, ShieldCheck, Printer } from 'lucide-react';
import styles from './cells.module.scss';

export default function CellsPage() {
    // Подключаем RTK Query хуки
    const { data: cells = [], isLoading } = useGetCellsQuery();
    const [createCell, { isLoading: isCreating }] = useCreateCellMutation();
    const [toggleBlock] = useToggleCellBlockMutation();
    const [triggerGetLabel] = useLazyGetCellLabelQuery();

    // Стейты формы
    const [zoneName, setZoneName] = useState('');
    const [rack, setRack] = useState('');
    const [shelf, setShelf] = useState('');
    const [position, setPosition] = useState('');
    const [formError, setFormError] = useState('');

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

    const handleToggleBlock = async (id: string, currentStatus: boolean) => {
        try {
            await toggleBlock({ id, isBlocked: !currentStatus }).unwrap();
        } catch (err) {
            console.error('Не удалось изменить статус ячейки', err);
        }
    };

    const handlePrintLabel = async (id: string, address: string) => {
        try {
            const res = await triggerGetLabel(id).unwrap();
            // Скачиваем ZPL как текстовый файл этикетки
            const blob = new Blob([res.zplCode], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `label_cell_${address}.zpl`;
            link.click();
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
                    <h3>Активные места хранения ({cells.length})</h3>
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
                                    {cells.map((cell) => (
                                        <tr key={cell.id} className={cell.blocked ? styles.rowBlocked : ''}>
                                            <td className={styles.addressText}>{cell.address}</td>
                                            <td>Зона {cell.zoneName}</td>
                                            <td className={styles.code}>
                                                {cell.barcode ? cell.barcode.replace(/^CELL-([A-Z0-9])(\d{2})(\d{2})(\d{2})$/, 'CELL-$1 $2 $3 $4') : cell.barcode}
                                            </td>
                                            <td>
                                                {cell.blocked ? (
                                                    <span className={`${styles.statusBadge} ${styles.blocked}`}>Заблокирована</span>
                                                ) : (
                                                    <span className={`${styles.statusBadge} ${styles.active}`}>Доступна</span>
                                                )}
                                            </td>
                                            <td className={styles.actions}>
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
                                    ))}
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