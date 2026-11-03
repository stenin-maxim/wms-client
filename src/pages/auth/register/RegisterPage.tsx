import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '@/features/auth/authApi';
import { setCredentials } from '@/features/auth/authSlice';
import styles from './register.module.scss'; // Импортируем локальный модуль стилей

export default function RegisterPage() {
    const dispatch = useDispatch();
    const [companyName, setCompanyName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [registerCompany, { isLoading }] = useRegisterMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        
        if (password !== confirmPassword) {
            alert('Пароли не совпадают!');
            return;
        }

        try {
            const response = await registerCompany({
                companyName,
                adminName,
                adminEmail,
                password,
            }).unwrap();

            dispatch(setCredentials({
                user: response.user,
                token: response.token
            }));

            console.log('Компания успешно зарегистрирована:', response.user.companyName);

            window.location.href = '/dashboard';
        } catch (err: any) {
            // Перехватываем структурированные ошибки от нашего GlobalExceptionHandler бэкенда
            if (err?.data?.message) {
                setErrorMessage(err.data.message);
            } else {
                setErrorMessage('Не удалось связаться с сервером склада. Попробуйте позже.');
            }
        }
    };

    return (
        <div className={styles.registerPage}>
            <div className={styles.registerCard}>
                
                <div className={styles.registerHeader}>
                    <h2>Регистрация компании</h2>
                    <p>Создайте учетную запись для вашей складской сети</p>
                </div>

                {errorMessage && (
                    <div className={styles.errorAlert}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.registerForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Название организации</label>
                        <input
                            type="text"
                            required
                            disabled={isLoading}
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className={styles.formInput}
                            placeholder="ООО АвтоЗапчасти"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>ФИО Директора склада</label>
                        <input
                            type="text"
                            required
                            disabled={isLoading}
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            className={styles.formInput}
                            placeholder="ФИО Директора"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email администратора</label>
                        <input
                            type="email"
                            required
                            disabled={isLoading}
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className={styles.formInput}
                            placeholder="admin@company.ru"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Пароль</label>
                        <input
                            type="password"
                            required
                            disabled={isLoading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.formInput}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Подтверждение пароля</label>
                        <input
                            type="password"
                            required
                            disabled={isLoading}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={styles.formInput}
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className={styles.submitBtn}>
                        {isLoading ? 'Создание склада...' : 'Зарегистрировать склад'}
                    </button>
                </form>

                <div className={styles.registerFooter}>
                    <p>Уже зарегистрированы? <a href="/login">Войти в систему</a></p>
                </div>
            </div>
        </div>
    );
}