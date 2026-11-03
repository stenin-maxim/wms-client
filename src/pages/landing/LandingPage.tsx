import { Link } from 'react-router-dom';
import styles from './landing.module.scss';

export default function LandingPage() {
    return (
        <div className={styles.landing}>
            
            {/* Навигационная панель */}
            <header className={styles.navbar}>
                <div className={styles.logo}>
                    📦 WMS Система
                </div>
                <div className={styles.navActions}>
                    <Link to="/login" className={styles.btnLogin}>
                        Войти
                    </Link>
                    <Link to="/register" className={styles.btnRegister}>
                        Регистрация склада
                    </Link>
                </div>
            </header>

            {/* Главный блок (Hero) */}
            <section className={styles.hero}>
                <div className={styles.badge}>B2B платформа для автобизнеса</div>
                <h1>
                    Умный учет склада запчастей и <span>контроль персонала</span> в одной системе
                </h1>
                <p className={styles.subtitle}>
                    Специализированное решение для малого и среднего бизнеса. Наведите идеальный порядок 
                    в адресном хранении деталей, контролируйте действия кладовщиков и забудьте о пересорте.
                </p>
                <div className={styles.ctaGroup}>
                    <Link to="/register" className={styles.heroPrimary}>
                        Начать бесплатно
                    </Link>
                    <Link to="/login" className={styles.heroSecondary}>
                        Демо-доступ
                    </Link>
                </div>
            </section>

            {/* Кому подойдет система */}
            <section className={styles.audience}>
                <h2 className={styles.sectionTitle}>Кому идеально подойдет система?</h2>
                <div className={styles.grid}>
                    <div className={styles.audienceCard}>
                        <h3>Небольшие склады запчастей</h3>
                        <p>Для тех, кто вырос из Excel и хочет запустить полноценное адресное ячеистое хранение без лишних затрат на дорогой софт.</p>
                    </div>
                    <div className={styles.audienceCard}>
                        <h3>Магазины с мини-складом</h3>
                        <p>Позволяет продавцам мгновенно видеть точное физическое расположение детали (Ряд-Стеллаж-Полка) при сборке заказа клиенту.</p>
                    </div>
                    <div className={styles.audienceCard}>
                        <h3>Автосервисы и СТО</h3>
                        <p>Учет запчастей на балансе мастеров, контроль выдачи деталей под конкретные ремонтные заказ-наряды.</p>
                    </div>
                </div>
            </section>

            {/* Функциональные возможности */}
            <section className={styles.features}>
                <h2 className={styles.sectionTitle}>Ключевые возможности платформы</h2>
                <div className={styles.featuresGrid}>
                    
                    {/* Модуль персонала */}
                    <div className={styles.featureCard}>
                        <h3>Управление персоналом</h3>
                        <ul>
                            <li>Строгий контроль: что прямо сейчас закреплено за конкретным сотрудником.</li>
                            <li>Логирование действий: кто принял товар, кто разместил, а кто укомплектовал заказ.</li>
                            <li>Персональная ответственность за недостачи и пересорт при инвентаризации.</li>
                            <li>Разграничение прав доступа (Владелец, Заведующий складом, Кладовщик на ТСД).</li>
                        </ul>
                    </div>

                    {/* Модуль склада */}
                    <div className={styles.featureCard}>
                        <h3>Адресный учет товаров</h3>
                        <ul>
                            <li>Гибкая сетка топологии склада (Зоны, Стеллажи, Полки, Ячейки).</li>
                            <li>Учет специфики автозапчастей (Бренды, артикулы, поддержка кросс-номеров и аналогов).</li>
                            <li>Поддержка работы с терминалами сбора данных (ТСД) через мобильный интерфейс.</li>
                            <li>Моментальное обновление остатков благодаря оптимизированному движку.</li>
                        </ul>
                    </div>

                </div>
            </section>

            {/* Подвал */}
            <footer className={styles.footer}>
                <p>© {new Date().getFullYear()} WMS Система. Все права защищены. Разработано для автоматизации малого и среднего бизнеса.</p>
            </footer>

        </div>
    );
}