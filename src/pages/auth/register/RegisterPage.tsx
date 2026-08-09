import React, { useState } from 'react';
import styles from './register.module.scss'; // Импортируем локальный модуль стилей

export default function RegisterPage() {
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert('Пароли не совпадают!');
            return;
        }

        console.log({ companyName, email, password });
        // Здесь в будущем будет вызов мутации регистрации из RTK Query
    };

    return (
        <div className={styles.registerPage}>
            <div className={styles.registerCard}>
                
                <div className={styles.registerHeader}>
                    <h2>Регистрация компании</h2>
                    <p>Создайте учетную запись для вашей складской сети</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.registerForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Название организации</label>
                        <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className={styles.formInput}
                            placeholder="ООО АвтоЗапчасти"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email администратора</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.formInput}
                            placeholder="admin@company.ru"
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

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Подтверждение пароля</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={styles.formInput}
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        Зарегистрировать склад
                    </button>
                </form>

                <div className={styles.registerFooter}>
                    <p>Уже зарегистрированы? <a href="/login">Войти в систему</a></p>
                </div>
            </div>
        </div>
    );
}