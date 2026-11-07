// src/pages/tsd/TsdScanPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useGetInvoicesQuery } from '@/features/invoices/invoicesApi';
import { useGetCellsQuery } from '@/features/cells/cellsApi';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { useScanProductToInvoiceMutation, usePlaceProductToCellMutation } from '@/features/tsd/tsdApi';
import { Barcode, ArrowDownLeft, Move, CheckCircle2, AlertTriangle } from 'lucide-react';
import styles from './tsdScan.module.scss';

type TsdMode = 'INBOUND' | 'PUTAWAY';

export default function TsdScanPage() {
    const [mode, setMode] = useState<TsdMode>('INBOUND');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    
    // Селекторы выбора документов/ячеек, если лазер не сработал
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [selectedCellId, setSelectedCellId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');

    // Стейты обратной связи (Цветовая индикация ТСД)
    const [statusMode, setStatusMode] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [statusMessage, setStatusMessage] = useState('');

    // Сетевые хуки
    const { data: invoices = [] } = useGetInvoicesQuery();
    const { data: cells = [] } = useGetCellsQuery();
    const { data: products = [] } = useGetProductsQuery();
    
    const [scanToInvoice, { isLoading: isScanning }] = useScanProductToInvoiceMutation();
    const [placeToCell, { isLoading: isPlacing }] = usePlaceProductToCellMutation();

    const inputRef = useRef<HTMLInputElement>(null);

    // Автофокус: удерживает поле ввода активным, чтобы лазерный сканер всегда мог вбить штрихкод
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [mode, statusMode]);

    // Аудио-сопровождение для имитации реального ТСД терминала
    const playBeep = (type: 'SUCCESS' | 'ERROR') => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'SUCCESS') {
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } else {
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        }
    };

    const handleTsdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        setStatusMode('IDLE');
        setStatusMessage('');

        const scannedValue = barcodeInput.trim();

        if (mode === 'INBOUND') {
            if (!selectedInvoiceId) {
                setStatusMode('ERROR');
                setStatusMessage('Сначала выберите накладную на экране ТСД');
                playBeep('ERROR');
                return;
            }

            try {
                await scanToInvoice({
                    invoiceId: selectedInvoiceId,
                    barcodeOrSku: scannedValue,
                    quantity
                }).unwrap();

                setStatusMode('SUCCESS');
                setStatusMessage(`Принято: ${quantity} шт. (Сканирование успешно)`);
                playBeep('SUCCESS');
                setBarcodeInput('');
            } catch (err: any) {
                setStatusMode('ERROR');
                setStatusMessage(err?.data?.message || 'Ошибка: товар отсутствует в накладной поставщика');
                playBeep('ERROR');
            }
        } else {
            // РЕЖИМ РАСКЛАДКИ (PUTAWAY)
            if (!selectedCellId || !selectedProductId) {
                setStatusMode('ERROR');
                setStatusMessage('Выберите целевую ячейку и товар для размещения');
                playBeep('ERROR');
                return;
            }

            try {
                await placeToCell({
                    productId: selectedProductId,
                    cellId: selectedCellId,
                    quantity
                }).unwrap();

                setStatusMode('SUCCESS');
                setStatusMessage(`Успешно размещено ${quantity} шт. на полку`);
                playBeep('SUCCESS');
                setBarcodeInput('');
            } catch (err: any) {
                setStatusMode('ERROR');
                setStatusMessage(err?.data?.message || 'Ошибка размещения остатка');
                playBeep('ERROR');
            }
        }
    };

    // Фильтруем накладные, оставляя только те, что сейчас в работе у кладовщиков
    const activeInvoices = invoices.filter(i => i.status === 'PENDING' || i.status === 'PROCESSING');
    const activeCells = cells.filter(c => !c.blocked);

    return (
        <div className={`${styles.tsdContainer} ${styles[statusMode.toLowerCase()]}`}>
            {/* ТУМБЛЕР РЕЖИМОВ РАБОТЫ ТСД */}
            <div className={styles.modeTabs}>
                <button 
                    onClick={() => { setMode('INBOUND'); setStatusMode('IDLE'); setStatusMessage(''); }}
                    className={`${styles.tabBtn} ${mode === 'INBOUND' ? styles.activeTab : ''}`}
                >
                    <ArrowDownLeft size={18} />
                    <span>1. Приёмка</span>
                </button>
                <button 
                    onClick={() => { setMode('PUTAWAY'); setStatusMode('IDLE'); setStatusMessage(''); }}
                    className={`${styles.tabBtn} ${mode === 'PUTAWAY' ? styles.activeTab : ''}`}
                >
                    <Move size={18} />
                    <span>2. Размещение</span>
                </button>
            </div>

            {/* КОНТЕКСТ ОПЕРАЦИИ */}
            <div className={styles.contextCard}>
                {mode === 'INBOUND' ? (
                    <div className={styles.formGroup}>
                        <label>Выберите приходную накладную</label>
                        <select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}>
                            <option value="">-- Накладная прихода --</option>
                            {activeInvoices.map(inv => (
                                <option key={inv.id} value={inv.id}>№{inv.number} ({inv.supplierName})</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className={styles.putawaySelectors}>
                        <div className={styles.formGroup}>
                            <label>Товар для раскладки</label>
                            <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                                <option value="">-- Выберите товар --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.brand} · {p.sku}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Целевая адресная ячейка</label>
                            <select value={selectedCellId} onChange={(e) => setSelectedCellId(e.target.value)}>
                                <option value="">-- Выберите полку --</option>
                                {activeCells.map(c => (
                                    <option key={c.id} value={c.id}>{c.address}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* ИНДИКАТОР ШТРИХКОДА И ВВОД */}
            <form onSubmit={handleTsdSubmit} className={styles.scanForm}>
                <div className={styles.quantitySection}>
                    <label>Количество (шт)</label>
                    <input 
                        type="number" min={1} required
                        value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className={styles.qtyInput}
                    />
                </div>

                <div className={styles.inputWrapper}>
                    <Barcode className={styles.barcodeIcon} size={24} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={mode === 'INBOUND' ? "Сканируйте штрихкод детали..." : "Штрихкод ячейки / детали..."}
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className={styles.tsdInput}
                        disabled={isScanning || isPlacing}
                    />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isScanning || isPlacing}>
                    {mode === 'INBOUND' ? 'Подтвердить приёмку' : 'Разместить на стеллаж'}
                </button>
            </form>

            {/* ЭКРАН СИГНАЛИЗАЦИИ И ОБРАТНОЙ СВЯЗИ ТСД */}
            {statusMode !== 'IDLE' && (
                <div className={styles.statusDisplay}>
                    {statusMode === 'SUCCESS' ? <CheckCircle2 size={36} /> : <AlertTriangle size={36} />}
                    <p className={styles.statusText}>{statusMessage}</p>
                </div>
            )}
        </div>
    );
}