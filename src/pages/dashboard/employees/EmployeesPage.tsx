// src/pages/dashboard/employees/EmployeesPage.tsx
import React, { useState } from 'react';
import { 
    useGetEmployeesQuery, 
    useCreateEmployeeMutation, 
    useChangeEmployeeStatusMutation 
} from '@/features/employees/employeesApi';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Users, UserPlus, UserX, UserCheck } from 'lucide-react';
import { ROLE_LABELS } from '@/shared/constants/roles';
import styles from './employees.module.scss';

export default function EmployeesPage() {
    const { user: currentUser } = useAppSelector((state) => state.auth);
    const { data: employees = [], isLoading } = useGetEmployeesQuery();
    const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
    const [changeStatus] = useChangeEmployeeStatusMutation();

    // Стейты формы
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'STOREKEEPER' | 'PICKER' | 'AUDITOR'>('PICKER');
    const [assignedEquipment, setAssignedEquipment] = useState('');
    const [formError, setFormError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        try {
            await createEmployee({ 
                name, 
                email, 
                password, 
                role, 
                assignedEquipment: assignedEquipment.trim() || undefined 
            }).unwrap();
            setName('');
            setEmail('');
            setPassword('');
            setAssignedEquipment('');
        } catch (err: any) {
            setFormError(err?.data?.message || 'Ошибка при добавлении сотрудника');
        }
    };

    const handleToggleStatus = async (employeeId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        try {
            await changeStatus({ employeeId, status: nextStatus }).unwrap();
        } catch (err: any) {
            alert(err?.data?.message || 'Не удалось изменить статус сотрудника');
        }
    };

    return (
        <div className={styles.employeesPage}>
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <Users size={28} />
                    <h2>Учет персонала и ТСД-аккаунты</h2>
                </div>
                <p>Управление правами доступа кладовщиков и комплектовщиков складской сети</p>
            </div>

            <div className={styles.dashboardGrid}>
                {/* ЛЕВАЯ ЧАСТЬ: Добавление сотрудника */}
                <div className={styles.card}>
                    <h3>Оформить сотрудника</h3>
                    <form onSubmit={handleCreate} className={styles.employeeForm}>
                        {formError && <div className={styles.errorMsg}>{formError}</div>}

                        <div className={styles.formGroup}>
                            <label>ФИО Сотрудника</label>
                            <input 
                                type="text" required placeholder="Иванов Петр Сергеевич"
                                value={name} onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Рабочий Email (Логин ТСД)</label>
                            <input 
                                type="email" required placeholder="ivanov@company.ru"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Стартовый пароль</label>
                            <input 
                                type="password" required placeholder="••••••••"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Закрепляемое оборудование / ТСД</label>
                            <input 
                                type="text" placeholder="Honeywell EDA51 (Опционально)"
                                value={assignedEquipment} onChange={(e) => setAssignedEquipment(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Назначаемая роль / Квалификация</label>
                            <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                                {Object.entries(ROLE_LABELS)
                                    // Исключаем SUPER_ADMIN из списка доступных для создания ролей
                                    .filter(([key]) => key !== 'SUPER_ADMIN') 
                                    .map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        <button type="submit" disabled={isCreating} className={styles.addBtn}>
                            <UserPlus size={18} />
                            <span>{isCreating ? 'Оформление...' : 'Выдать доступ'}</span>
                        </button>
                    </form>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: Список персонала */}
                <div className={styles.cardTable}>
                    <h3>Штатное расписание организации ({employees.length})</h3>
                    {isLoading ? (
                        <div className={styles.loading}>Загрузка списка персонала...</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.wmsTable}>
                                <thead>
                                    <tr>
                                        <th>ФИО / Инвентарь</th>
                                        <th>Логин (Email)</th>
                                        <th>Доступ / Роль</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp) => {
                                        const isMe = emp.id === currentUser?.id;
                                        const status = emp.status || 'ACTIVE';
                                        return (
                                            <tr key={emp.id} className={`${isMe ? styles.rowMe : ''} ${status === 'BLOCKED' ? styles.rowBlocked : ''}`}>
                                                <td>
                                                    <div className={styles.nameBlock}>
                                                        <span className={styles.nameText}>
                                                            {emp.name} {isMe && <span className={styles.meBadge}>Вы</span>}
                                                        </span>
                                                        {emp.assignedEquipment && (
                                                            <div className={styles.equipmentBadge}>
                                                                <span>{emp.assignedEquipment}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={styles.emailText} data-label="Логин">{emp.email}</td>
                                                <td data-label="Роль">
                                                    <span className={styles.roleTag}>{ROLE_LABELS[emp.role] || emp.role}</span>
                                                </td>
                                                <td data-label="Статус">
                                                    {isMe ? (
                                                        <span className={`${styles.statusBadge} ${styles.active}`}>Владелец</span>
                                                    ) : status === 'ACTIVE' ? (
                                                        <span className={`${styles.statusBadge} ${styles.active}`}>Активен</span>
                                                    ) : (
                                                        <span className={`${styles.statusBadge} ${styles.blocked}`}>Заблокирован</span>
                                                    )}
                                                </td>
                                                <td className={styles.actions}>
                                                    {!isMe ? (
                                                        <button 
                                                            onClick={() => handleToggleStatus(emp.id, status)}
                                                            className={`${styles.actionBtn} ${status === 'BLOCKED' ? styles.unblock : styles.block}`}
                                                            title={status === 'BLOCKED' ? "Активировать" : "Заблокировать"}
                                                        >
                                                            {status === 'BLOCKED' ? <UserCheck size={16} /> : <UserX size={16} />}
                                                        </button>
                                                    ) : (
                                                        <span className={styles.lockText}>Защищено</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}