import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/reduxHooks';
import { useLoginMutation } from '@/features/auth/authApi';
import { setCredentials } from '@/features/auth/authSlice';
import styles from './login.module.scss';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [serverError, setServerError] = useState('');
    
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const location = useLocation();

    const [login, { isLoading }] = useLoginMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userData = await login({ email, password }).unwrap();
            dispatch(setCredentials(userData));
            
            // Проверяем, откуда пришел пользователь, или отправляем по роли по умолчанию
            const from = location.state?.from?.pathname;
            if (from) {
                navigate(from, { replace: true });
            } else {
                // Если ссылки не было, разделяем потоки по ролям
                if (userData.user.role === 'STOREKEEPER' || userData.user.role === 'PICKER') {
                    navigate('/tsd/scan', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            }
        } catch (err: any) {
            console.error('Ошибка авторизации:', err);
            // Выводим точный текст ошибки от нашего Java-исключения
            if (err?.data?.message) {
                setServerError(err.data.message);
            } else {
                setServerError('Неверный email или пароль');
            }
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginCard}>
                
                <div className={styles.loginHeader}>
                    <h2>WMS Система</h2>
                    <p>Система учета персонала и адресного хранения</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    {/* Вывод динамического текста ошибки */}
                    {serverError && (
                        <div className={styles.errorMessage}>
                            {serverError}
                        </div>
                    )}
                    
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email компании</label>
                        <input
                            type="email"
                            required
                            disabled={isLoading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.formInput}
                            placeholder="director@parts-company.ru"
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

                    <button type="submit" disabled={isLoading} className={styles.submitBtn}>
                        {isLoading ? 'Проверка...' : 'Войти в личный кабинет'}
                    </button>
                </form>

                <div className={styles.loginFooter}>
                    <p>Новая компания? <a href="/register">Зарегистрировать склад</a></p>
                </div>
            </div>
        </div>
    );
}