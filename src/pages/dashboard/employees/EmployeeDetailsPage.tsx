import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useGetEmployeesQuery,
    useUpdateEmployeeProfileMutation,
    useChangeEmployeeStatusMutation
} from '@/features/employees/employeesApi';
import { useGetStockHistoryQuery } from '@/features/stocks/stockHistoryApi';
import { useAppSelector } from '@/hooks/reduxHooks';
import { ROLE_LABELS } from '@/shared/constants/roles';
import {
    ArrowLeft,
    User,
    Shield,
    Briefcase,
    Plus,
    X,
    Save,
    UserX,
    UserCheck,
    History
} from 'lucide-react';
import styles from './employeeDetails.module.scss';

export default function EmployeeDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAppSelector((state) => state.auth);

    const { data: employees = [], isLoading } = useGetEmployeesQuery();
    const { data: history = [] } = useGetStockHistoryQuery();
    const [updateProfile, { isLoading: isSaving }] = useUpdateEmployeeProfileMutation();
    const [changeStatus] = useChangeEmployeeStatusMutation();

    const employee = employees.find((e) => e.id === id);
    const isMe = employee?.id === currentUser?.id;

    // Стейты редактирования профиля
    const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'STOREKEEPER' | 'PICKER' | 'AUDITOR'>('PICKER');
    const [equipmentList, setEquipmentList] = useState<string[]>([]);
    const [newItemInput, setNewItemInput] = useState('');
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Синхронизация стейтов при загрузке сотрудника
    useEffect(() => {
        if (employee) {
            if (employee.role !== 'SUPER_ADMIN') {
                setRole(employee.role);
            }
            if (employee.assignedEquipment) {
                const items = employee.assignedEquipment
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);
                setEquipmentList(items);
            } else {
                setEquipmentList([]);
            }
        }
    }, [employee]);

    const handleAddEquipment = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newItemInput.trim();
        if (!trimmed) return;
        if (!equipmentList.includes(trimmed)) {
            setEquipmentList([...equipmentList, trimmed]);
        }
        setNewItemInput('');
    };

    const handleRemoveEquipment = (itemToRemove: string) => {
        setEquipmentList(equipmentList.filter((item) => item !== itemToRemove));
    };

    const handleSaveChanges = async () => {
        if (!employee) return;
        setSaveMessage(null);

        try {
            await updateProfile({
                id: employee.id,
                role,
                assignedEquipment: equipmentList.join(', ')
            }).unwrap();

            setSaveMessage({ type: 'success', text: 'Профиль и карточка учета инвентаря успешно сохранены' });
        } catch (err: any) {
            setSaveMessage({
                type: 'error',
                text: err?.data?.message || 'Ошибка при сохранении профиля'
            });
        }
    };

    const handleToggleStatus = async () => {
        if (!employee || isMe) return;
        const currentStatus = employee.status || 'ACTIVE';
        const nextStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';

        try {
            await changeStatus({ employeeId: employee.id, status: nextStatus }).unwrap();
        } catch (err: any) {
            alert(err?.data?.message || 'Не удалось изменить статус');
        }
    };

    if (isLoading) {
        return <div className={styles.loading}>Загрузка личной карточки сотрудника...</div>;
    }

    if (!employee) {
        return (
            <div className={styles.notFound}>
                <h3>Сотрудник не найден</h3>
                <button onClick={() => navigate('/dashboard/employees')} className={styles.backBtn}>
                    <ArrowLeft size={16} />
                    <span>Вернуться к штатному расписанию</span>
                </button>
            </div>
        );
    }

    const status = employee.status || 'ACTIVE';
    const employeeLogs = history.filter((log) => log.operatorName === employee.name).slice(0, 10);

    return (
        <div className={styles.detailsPage}>
            <button onClick={() => navigate('/dashboard/employees')} className={styles.backBtn}>
                <ArrowLeft size={16} />
                <span>Назад к списку сотрудников</span>
            </button>

            {/* ШАПКА ПРОФИЛЯ */}
            <div className={styles.headerCard}>
                <div className={styles.userInfo}>
                    <div className={styles.avatarCircle}>
                        <User size={30} />
                    </div>
                    <div>
                        <div className={styles.nameRow}>
                            <h2>{employee.name}</h2>
                            {isMe && <span className={styles.meBadge}>Ваш профиль</span>}
                            {status === 'ACTIVE' ? (
                                <span className={`${styles.statusBadge} ${styles.active}`}>Активен</span>
                            ) : (
                                <span className={`${styles.statusBadge} ${styles.blocked}`}>Заблокирован</span>
                            )}
                        </div>
                        <p className={styles.emailText}>{employee.email}</p>
                    </div>
                </div>

                {!isMe && (
                    <button
                        onClick={handleToggleStatus}
                        className={`${styles.statusActionBtn} ${status === 'BLOCKED' ? styles.unblockBtn : styles.blockBtn}`}
                    >
                        {status === 'BLOCKED' ? <UserCheck size={16} /> : <UserX size={16} />}
                        <span>{status === 'BLOCKED' ? 'Разблокировать доступ' : 'Заблокировать сотрудника'}</span>
                    </button>
                )}
            </div>

            {saveMessage && (
                <div className={saveMessage.type === 'success' ? styles.successBanner : styles.errorBanner}>
                    {saveMessage.text}
                </div>
            )}

            <div className={styles.contentGrid}>
                {/* ЛЕВАЯ КОЛОНКА: Должность и права доступа */}
                <div className={styles.card}>
                    <h3>
                        <Shield size={18} />
                        <span>Должность и права доступа в WMS</span>
                    </h3>

                    <div className={styles.formGroup}>
                        <label>Назначенная роль</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            disabled={isMe}
                        >
                            {Object.entries(ROLE_LABELS)
                                .filter(([key]) => key !== 'SUPER_ADMIN')
                                .map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                        </select>
                        {isMe && (
                            <span className={styles.helperText}>
                                Вы не можете изменить собственную роль администратора.
                            </span>
                        )}
                    </div>

                    <div className={styles.roleDescriptionBox}>
                        <strong>Зона ответственности:</strong>
                        <p>
                            {role === 'ADMIN' && 'Полный доступ ко всем настройкам склада, персоналу, топологии и аналитике.'}
                            {role === 'MANAGER' && 'Управление номенклатурой, адресными ячейками, приходными накладными и заказами.'}
                            {role === 'STOREKEEPER' && 'Приёмка товаров от поставщиков на рампе и раскладка по стеллажам через ТСД.'}
                            {role === 'PICKER' && 'Работа исключительно в мобильном интерфейсе ТСД на сборку и отгрузку заказов.'}
                            {role === 'AUDITOR' && 'Просмотр карты остатков и аудит журнала складских транзакций.'}
                        </p>
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА: Карточка материальной ответственности */}
                <div className={styles.card}>
                    <h3>
                        <Briefcase size={18} />
                        <span>Закрепленное оборудование, спецодежда и инструмент</span>
                    </h3>

                    <form onSubmit={handleAddEquipment} className={styles.addItemForm}>
                        <input
                            type="text"
                            placeholder="Например: ТСД Zebra TC21, Зимняя куртка (р. 50), Сканер-кольцо..."
                            value={newItemInput}
                            onChange={(e) => setNewItemInput(e.target.value)}
                        />
                        <button type="submit" className={styles.addTagBtn}>
                            <Plus size={16} />
                            <span>Выдать</span>
                        </button>
                    </form>

                    <div className={styles.tagsContainer}>
                        {equipmentList.length > 0 ? (
                            equipmentList.map((item, idx) => (
                                <div key={idx} className={styles.equipmentTag}>
                                    <span>{item}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveEquipment(item)}
                                        title="Списать / Вернуть на склад"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyEquipment}>
                                За сотрудником пока не закреплено оборудование, спецодежда или инструменты.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* КНОПКА СОХРАНЕНИЯ ИЗМЕНЕНИЙ */}
            <div className={styles.saveBar}>
                <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className={styles.saveBtn}
                >
                    <Save size={18} />
                    <span>{isSaving ? 'Сохранение...' : 'Сохранить изменения в профиле'}</span>
                </button>
            </div>

            {/* ЖУРНАЛ ОПЕРАЦИЙ СОТРУДНИКА */}
            <div className={styles.card}>
                <h3>
                    <History size={18} />
                    <span>Последние складские операции сотрудника</span>
                </h3>
                <div className={styles.tableWrapper}>
                    <table className={styles.wmsTable}>
                        <thead>
                            <tr>
                                <th>Дата и время</th>
                                <th>Операция</th>
                                <th>Товар</th>
                                <th>Ячейка</th>
                                <th>Количество</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employeeLogs.map((log) => (
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
                                    <td data-label="Ячейка" className={styles.cellText}>
                                        {log.cellAddress}
                                    </td>
                                    <td data-label="Количество" className={log.operationType === 'PICKING' ? styles.textRed : styles.textGreen}>
                                        {log.operationType === 'PICKING' ? '-' : '+'}{log.quantity} шт.
                                    </td>
                                </tr>
                            ))}
                            {employeeLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={styles.emptyTable}>
                                        Сотрудник ещё не выполнял операций сканирования.
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