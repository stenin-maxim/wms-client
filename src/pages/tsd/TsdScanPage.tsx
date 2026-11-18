// src/pages/tsd/TsdScanPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useGetInvoicesQuery } from '@/features/invoices/invoicesApi';
import { useGetCellsQuery } from '@/features/cells/cellsApi';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { useGetOrdersQuery } from '@/features/orders/ordersApi';
import { usePickProductFromCellMutation } from '@/features/tsd/tsdApi';
import { useGetStockBalanceQuery } from '@/features/stocks/stocksApi';
import { useScanProductToInvoiceMutation, usePlaceProductToCellMutation } from '@/features/tsd/tsdApi';
import { Barcode, ArrowDownLeft, Move, CheckCircle2, AlertTriangle, Camera, CameraOff, ShoppingBag } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import styles from './tsdScan.module.scss';

type TsdMode = 'INBOUND' | 'PUTAWAY' | 'PICKING';

export default function TsdScanPage() {
    const [mode, setMode] = useState<TsdMode>('INBOUND');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    // Селекторы выбора документов/ячеек, если лазер не сработал
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [selectedCellId, setSelectedCellId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [pickingCellAddress, setPickingCellAddress] = useState('');

    // Стейты обратной связи (Цветовая индикация ТСД)
    const [statusMode, setStatusMode] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [statusMessage, setStatusMessage] = useState('');
    
    // Сетевые хуки
    const { data: orders = [] } = useGetOrdersQuery();
    const { data: invoices = [] } = useGetInvoicesQuery();
    const { data: cells = [] } = useGetCellsQuery();
    const { data: products = [] } = useGetProductsQuery();
    const { data: stocks = [] } = useGetStockBalanceQuery();
    
    const [scanToInvoice, { isLoading: isScanning }] = useScanProductToInvoiceMutation();
    const [placeToCell, { isLoading: isPlacing }] = usePlaceProductToCellMutation();
    const [pickFromCell, { isLoading: isPicking }] = usePickProductFromCellMutation();
    
    const activeOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING');

    const inputRef = useRef<HTMLInputElement>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    // Находим выбранный заказ и формируем для него маршрутный лист сборки
    const selectedOrder = React.useMemo(
        () => activeOrders.find((o) => o.id === selectedOrderId),
        [activeOrders, selectedOrderId]
    );

    // Автофокус: удерживает поле ввода активным, чтобы лазерный сканер всегда мог вбить штрихкод
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [mode, statusMode]);

    useEffect(() => {
        if (isCameraOpen) {
            const scanner = new Html5QrcodeScanner(
                'reader',
                { 
                    fps: 15,
                    qrbox: { width: 250, height: 150 },
                    experimentalFeatures: { useBarCodeDetectorIfSupported: true }
                },
                false
            );

            scanner.render(
                (decodedText) => {
                    setBarcodeInput(decodedText);
                    setIsCameraOpen(false);
                    scanner.clear();
                    
                    setTimeout(() => {
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                        processScanAction(decodedText, fakeEvent);
                    }, 100);
                },
                () => {}
            );

            scannerRef.current = scanner;
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error(err));
            }
        };
    }, [isCameraOpen, mode, selectedInvoiceId, selectedCellId, selectedProductId, quantity]);

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

    const handleTsdSubmit = (e: React.FormEvent) => {
        processScanAction(barcodeInput, e);
    };

    const processScanAction = async (scannedValue: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!scannedValue.trim()) return;

        setStatusMode('IDLE');
        setStatusMessage('');

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
                    barcodeOrSku: scannedValue.trim(),
                    quantity
                }).unwrap();

                setStatusMode('SUCCESS');
                setStatusMessage(`Принято: ${quantity} шт. (Сканирование успешно)`);
                playBeep('SUCCESS');
                setBarcodeInput('');
            } catch (err: any) {
                setStatusMode('ERROR');
                setStatusMessage(err?.data?.message || 'Ошибка: товар отсутствует в накладной');
                playBeep('ERROR');
            }
        } else if (mode === 'PICKING') {
            if (!selectedOrderId || !pickingCellAddress) {
                setStatusMode('ERROR');
                setStatusMessage('Выберите заказ и укажите ячейку отбора');
                playBeep('ERROR');
                return;
            }

            try {
                await pickFromCell({
                    orderId: selectedOrderId,
                    cellBarcodeOrAddress: pickingCellAddress,
                    productBarcodeOrSku: scannedValue.trim(),
                    quantity
                }).unwrap();

                setStatusMode('SUCCESS');
                setStatusMessage(`Отобрано ${quantity} шт. из ячейки ${pickingCellAddress}`);
                playBeep('SUCCESS');
                setBarcodeInput('');
            } catch (err: any) {
                setStatusMode('ERROR');
                setStatusMessage(err?.data?.message || 'Ошибка отбора товара из ячейки');
                playBeep('ERROR');
            }
        } else {
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

    // Вычисляем буфер приёмки (товары, которые приняты по накладным, но ещё не лежат на полках)
    const availableForPutaway = React.useMemo(() => {
        const acceptedMap: Record<string, number> = {};
        const placedMap: Record<string, number> = {};

        // Считаем сколько всего принято по всем накладным
        invoices.forEach((inv) => {
            inv.items.forEach((item) => {
                if (item.acceptedQuantity > 0) {
                    acceptedMap[item.productId] = (acceptedMap[item.productId] || 0) + item.acceptedQuantity;
                }
            });
        });

        // Считаем сколько уже разложено по ячейкам склада
        stocks.forEach((st) => {
            placedMap[st.productId] = (placedMap[st.productId] || 0) + st.quantity;
        });

        // Формируем список товаров с ненулевым доступным остатком в зоне приёмки
        return products
            .map((product) => {
                const totalAccepted = acceptedMap[product.id] || 0;
                const totalPlaced = placedMap[product.id] || 0;
                const remainingToPlace = totalAccepted - totalPlaced;

                return {
                    ...product,
                    remainingToPlace
                };
            })
            .filter((item) => item.remainingToPlace > 0);
    }, [invoices, stocks, products]);

    // Список неподобранных позиций заказа с привязкой к конкретным ячейкам склада
    const pickingRouteHints = React.useMemo(() => {
        if (!selectedOrder) return [];

        return selectedOrder.items
            .filter((item) => item.pickedQuantity < item.expectedQuantity)
            .map((item) => {
                const remainingToPick = item.expectedQuantity - item.pickedQuantity;

                // Ищем все активные ячейки, где лежит этот товар
                const locations = stocks
                    .filter((st) => st.productId === item.productId && st.quantity > 0)
                    .map((st) => {
                        const cellObj = activeCells.find((c) => c.id === st.cellId);
                        return cellObj
                            ? {
                                cellId: st.cellId,
                                cellAddress: st.cellAddress,
                                availableQty: st.quantity
                            }
                            : null;
                    })
                    .filter(Boolean) as { cellId: string; cellAddress: string; availableQty: number }[];

                // Находим сам товар в каталоге, чтобы взять его штрихкод или SKU для автоподстановки
                const productObj = products.find((p) => p.id === item.productId);

                return {
                    ...item,
                    remainingToPick,
                    locations,
                    scanCode: productObj?.barcode || item.productSku
                };
            });
    }, [selectedOrder, stocks, activeCells, products]);

    // Список ячеек для селектора в режиме сборки (только те, где есть товары из заказа)
    const cellsForPicking = React.useMemo(() => {
        if (!selectedOrder) return [];

        const neededProductIds = new Set(
            selectedOrder.items
                .filter((i) => i.pickedQuantity < i.expectedQuantity)
                .map((i) => i.productId)
        );

        // Группируем доступные остатки по ячейкам
        const cellMap = new Map<string, { address: string; itemsInfo: string[] }>();

        stocks.forEach((st) => {
            if (neededProductIds.has(st.productId) && st.quantity > 0) {
                const isCellActive = activeCells.some((c) => c.id === st.cellId);
                if (!isCellActive) return;

                const existing = cellMap.get(st.cellAddress) || {
                    address: st.cellAddress,
                    itemsInfo: []
                };
                existing.itemsInfo.push(`${st.productSku}: ${st.quantity} шт.`);
                cellMap.set(st.cellAddress, existing);
            }
        });

        return Array.from(cellMap.values());
    }, [selectedOrder, stocks, activeCells]);

    return (
        <div className={`${styles.tsdContainer} ${styles[statusMode.toLowerCase()]}`}>
            {/* ТУМБЛЕР РЕЖИМОВ РАБОТЫ ТСД */}
            <div className={styles.modeTabs} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <button 
                    type="button"
                    onClick={() => { setMode('INBOUND'); setStatusMode('IDLE'); setStatusMessage(''); }}
                    className={`${styles.tabBtn} ${mode === 'INBOUND' ? styles.activeTab : ''}`}
                >
                    <ArrowDownLeft size={16} />
                    <span>Приёмка</span>
                </button>
                <button 
                    type="button"
                    onClick={() => { setMode('PUTAWAY'); setStatusMode('IDLE'); setStatusMessage(''); }}
                    className={`${styles.tabBtn} ${mode === 'PUTAWAY' ? styles.activeTab : ''}`}
                >
                    <Move size={16} />
                    <span>Размещение</span>
                </button>
                <button 
                    type="button"
                    onClick={() => { setMode('PICKING'); setStatusMode('IDLE'); setStatusMessage(''); }}
                    className={`${styles.tabBtn} ${mode === 'PICKING' ? styles.activeTab : ''}`}
                >
                    <ShoppingBag size={16} />
                    <span>Сборка</span>
                </button>
            </div>

            {/* КОНТЕКСТ ОПЕРАЦИИ */}
            <div className={styles.contextCard}>
                {mode === 'INBOUND' && (
                    <div className={styles.formGroup}>
                        <label>Выберите приходную накладную</label>
                        <select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}>
                            <option value="">-- Накладная прихода --</option>
                            {activeInvoices.map(inv => (
                                <option key={inv.id} value={inv.id}>№{inv.number} ({inv.supplierName})</option>
                            ))}
                        </select>
                    </div>
                )}

                {mode === 'PUTAWAY' && (
                    <div className={styles.putawaySelectors}>
                        <div className={styles.formGroup}>
                            <label>Товар из зоны приёмки</label>
                            <select 
                                value={selectedProductId} 
                                onChange={(e) => {
                                    const prodId = e.target.value;
                                    setSelectedProductId(prodId);
                                    // Автоматически подставляем весь доступный остаток в поле количества для удобства
                                    const found = availableForPutaway.find(p => p.id === prodId);
                                    if (found) {
                                        setQuantity(found.remainingToPlace);
                                    }
                                }}
                            >
                                <option value="">
                                    {availableForPutaway.length > 0 
                                        ? '-- Выберите принятый товар --' 
                                        : '-- Зона приёмки пуста --'}
                                </option>
                                {availableForPutaway.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.brand} · {p.sku} (Доступно: {p.remainingToPlace} шт.)
                                    </option>
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

                {mode === 'PICKING' && (
                    <div className={styles.putawaySelectors}>
                        <div className={styles.formGroup}>
                            <label>Заказ покупателя на сборку</label>
                            <select 
                                value={selectedOrderId} 
                                onChange={(e) => {
                                    setSelectedOrderId(e.target.value);
                                    setPickingCellAddress('');
                                }}
                            >
                                <option value="">-- Выберите заказ --</option>
                                {activeOrders.map((ord) => (
                                    <option key={ord.id} value={ord.id}>
                                        {ord.orderNumber} ({ord.customerName})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* МАРШРУТНЫЙ ЛИСТ ПОДСКАЗОК ДЛЯ СБОРЩИКА */}
                        {selectedOrder && pickingRouteHints.length > 0 && (
                            <div className={styles.routeHintsBox}>
                                <span className={styles.hintsTitle}>Маршрутный лист (нажмите для выбора):</span>
                                {pickingRouteHints.map((hint) => (
                                    <div key={hint.id} className={styles.hintCard}>
                                        <div className={styles.hintTop}>
                                            <span className={styles.hintProduct}>
                                                {hint.productBrand} · {hint.productSku}
                                            </span>
                                            <span className={styles.hintNeed}>
                                                Нужно: {hint.remainingToPick} шт.
                                            </span>
                                        </div>
                                        <div className={styles.hintName}>{hint.productName}</div>

                                        {hint.locations.length > 0 ? (
                                            <div className={styles.hintLocations}>
                                                {hint.locations.map((loc) => (
                                                    <button
                                                        key={loc.cellId}
                                                        type="button"
                                                        className={`${styles.locationPill} ${pickingCellAddress === loc.cellAddress ? styles.activePill : ''}`}
                                                        onClick={() => {
                                                            setPickingCellAddress(loc.cellAddress);
                                                            setBarcodeInput(hint.scanCode);
                                                            setQuantity(Math.min(hint.remainingToPick, loc.availableQty));
                                                        }}
                                                    >
                                                        <span>Полка {loc.cellAddress}</span>
                                                        <strong>({loc.availableQty} шт.)</strong>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={styles.hintNoStock}>
                                                Нет на остатках в активных ячейках!
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Ячейка, из которой берете товар</label>
                            <select 
                                value={pickingCellAddress} 
                                onChange={(e) => setPickingCellAddress(e.target.value)}
                                disabled={!selectedOrderId}
                            >
                                <option value="">
                                    {!selectedOrderId 
                                        ? '-- Сначала выберите заказ --' 
                                        : cellsForPicking.length > 0 
                                            ? '-- Выберите полку с товаром --' 
                                            : '-- Нет ячеек с нужным товаром --'}
                                </option>
                                {cellsForPicking.map((c) => (
                                    <option key={c.address} value={c.address}>
                                        {c.address} ({c.itemsInfo.join(', ')})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {isCameraOpen && (
                <div className={styles.cameraContainer}>
                    <div id="reader" className={styles.scannerElement}></div>
                </div>
            )}

            {/* ИНДИКАТОР ШТРИХКОДА И ВВОД */}
            <form onSubmit={handleTsdSubmit} className={styles.scanForm}>
                <div className={styles.quantitySection}>
                    <label>Количество для обработки</label>
                    
                    <div className={styles.qtyControlsRow}>
                        <button 
                            type="button" 
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            className={styles.qtyChangeBtn}
                        >
                            -1
                        </button>
                        <input 
                            type="number" 
                            min={1} 
                            required
                            value={quantity} 
                            // СВЕРХВАЖНО: Автоматически выделяет весь текст при фокусе для мгновенной перезаписи с клавиатуры!
                            onFocus={(e) => e.target.select()} 
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className={styles.qtyInput}
                        />
                        <button 
                            type="button" 
                            onClick={() => setQuantity(prev => prev + 1)}
                            className={styles.qtyChangeBtn}
                        >
                            +1
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setQuantity(prev => prev + 5)}
                            className={styles.qtyChangeBtn}
                        >
                            +5
                        </button>
                    </div>
                </div>

                <div className={styles.inputWrapper}>
                    <Barcode 
                        className={styles.barcodeIcon} 
                        size={24} 
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={mode === 'INBOUND' ? "Штрихкод детали..." : "Штрихкод..."}
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className={styles.tsdInput}
                        disabled={isScanning || isPlacing || isPicking}
                    />
                    
                    <button
                        type="button"
                        onClick={() => setIsCameraOpen(!isCameraOpen)}
                        className={`${styles.cameraToggleBtn} ${isCameraOpen ? styles.camActive : ''}`}
                        title="Сканировать через камеру телефона"
                    >
                        {isCameraOpen ? <CameraOff size={20} /> : <Camera size={20} />}
                    </button>
                </div>

                <button 
                    type="submit" 
                    className={styles.submitBtn} 
                    disabled={isScanning || isPlacing || isPicking}
                >
                    {mode === 'INBOUND' ? 'Подтвердить приёмку' : mode === 'PUTAWAY' ? 'Разместить на стеллаж' : 'Забрать из ячейки'}
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