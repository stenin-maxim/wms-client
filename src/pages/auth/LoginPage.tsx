import React, { useState } from 'react';
import styles from './Login.module.scss'; // Импортируем SCSS Module

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ email, password });
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginCard}>
                
                <div className={styles.loginHeader}>
                    <h2>WMS Система</h2>
                    <p>Система учета персонала и адресного хранения</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email компании</label>
                        <input
                            type="email"
                            required
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.formInput}
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        Войти в личный кабинет
                    </button>
                </form>

                <div className={styles.loginFooter}>
                    <p>Новая компания? <a href="/register">Зарегистрировать склад</a></p>
                </div>
            </div>
        </div>
    );
}