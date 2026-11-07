// src/layouts/tsd/TsdLayout.tsx
import React from 'react';
import { Smartphone } from 'lucide-react';
import styles from './tsdLayout.module.scss';

interface TsdLayoutProps {
    children?: React.ReactNode;
}

export default function TsdLayout({ children }: TsdLayoutProps) {
    return (
        <div className={styles.tsdLayoutWrapper}>
            <header className={styles.tsdHeader}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Smartphone size={16} style={{ color: '#f59e0b' }} />
                    <span>Терминал Сбора Данных (ТСД)</span>
                </div>
            </header>
            
            <main className={styles.tsdContent}>
                {children}
            </main>
        </div>
    );
}