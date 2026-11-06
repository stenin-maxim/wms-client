// src/pages/dashboard/InvoicesPage.tsx
import React, { useState } from 'react';
import { useGetInvoicesQuery, useCreateInvoiceMutation } from '@/features/invoices/invoicesApi';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { FileText, Plus, FilePlus, ClipboardList, CheckCircle2 } from 'lucide-react';
import styles from './invoices.module.scss';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
    'PENDING': { label: 'Ожидается поставка', class: styles.pending },
    'PROCESSING': { label: 'В процессе приёмки', class: styles.processing },
    'COMPLETED': { label: 'Товар принят (Оприходован)', class: styles.completed },
    'CANCELED': { label: 'Поставка отменена', class: styles.canceled }
};

export default function InvoicesPage() {
    const { data: invoices = [], isLoading } = useGetInvoicesQuery();
    const { data: products = [] } = useGetProductsQuery();
    const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();

    // Состояния формы накладной
    const [number, setNumber] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [formItems, setFormItems] = useState<{ productId: string; expectedQuantity: number }[]>([
        { productId: '', expectedQuantity: 1 }
    ]);
    const [formError, setFormError] = useState('');

    const handleAddItemRow = () => {
        setFormItems([...formItems, { productId: '', expectedQuantity: 1 }]);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const updated = [...formItems];
        updated[index] = { ...updated[index], [field]: value };
        setFormItems(updated);
    };

    const handleRemoveItemRow = (index: number) => {
        if (formItems.length > 1) {
            setFormItems(formItems.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // Валидация заполнения товаров
        const hasEmptyProduct = formItems.some(item => !item.productId);
        if (hasEmptyProduct) {
            setFormError('Выберите товар для каждой добавляемой строки');
            return;
        }

        try {
            await createInvoice({
                number: number.trim(),
                supplierName: supplierName.trim(),
                items: formItems
            }).unwrap();

            setNumber('');
            setSupplierName('');
            setFormItems([{ productId: '', expectedQuantity: 1 }]);
        } catch (err: any) {
            setFormError(err?.data?.message || 'Ошибка создания накладной прихода');
        }
    };

    return (
        <div className={styles.invoicesPage}>
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <FileText size={28} />
                    <h2>Поступления и приёмка</h2>
                </div>
                <p>Управление входящими накладными, графиком прибытия машин и планом пересчета на рампе</p>
            </div>
            <div className={styles.dashboardGrid}>
                {/* ЛЕВАЯ ЧАСТЬ: Заведение документа прихода */}
                <div className={styles.card}>
                    <h3>Завести накладную ожидания</h3>
                    <form onSubmit={handleSubmit} className={styles.invoiceForm}>
                        {formError && <div className={styles.errorMsg}>{formError}</div>}
                        
                        <div className={styles.formGroup}>
                            <label>Номер документа (ТОРГ-12 / Инвойс)</label>
                            <input 
                                type="text" required placeholder="П-88492"
                                value={number} onChange={(e) => setNumber(e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Официальное имя поставщика</label>
                            <input 
                                type="text" required placeholder="ООО Авто Снабжение"
                                value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
                            />
                        </div>
                        {/* Динамический список позиций вложения */}
                        <div className={styles.itemsSection}>
                            <label className={styles.sectionLabel}>Состав спецификации накладной</label>
                            {formItems.map((item, index) => (
                                <div key={index} className={styles.itemRowGrid}>
                                    <div className={styles.formGroup}>
                                        <select 
                                            value={item.productId} 
                                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                            required
                                        >
                                            <option value="">-- Выберите товар --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.brand} · {p.sku} ({p.name})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <input 
                                            type="number" min={1} required 
                                            value={item.expectedQuantity}
                                            onChange={(e) => handleItemChange(index, 'expectedQuantity', parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    {formItems.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveItemRow(index)}
                                            className={styles.removeRowBtn}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddItemRow} className={styles.addRowBtn}>
                                <Plus size={14} />
                                <span>Добавить строку товара</span>
                            </button>
                        </div>
                        <button type="submit" disabled={isCreating} className={styles.addBtn}>
                            <FilePlus size={18} />
                            <span>{isCreating ? 'Сохранение...' : 'Зарегистрировать поставку'}</span>
                        </button>
                    </form>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: Журнал документов прихода */}
                <div className={styles.cardTable}>
                    <h3>Журнал входящих поставок ({invoices.length})</h3>
                    {isLoading ? (
                        <div className={styles.loading}>Загрузка документов приёма...</div>
                    ) : (
                        <div className={styles.invoicesList}>
                            {invoices.map((invoice) => {
                                const status = STATUS_LABELS[invoice.status] || { label: invoice.status, class: '' };
                                return (
                                    <div key={invoice.id} className={styles.invoiceDocumentCard}>
                                        <div className={styles.docHeader}>
                                            <div className={styles.docMeta}>
                                                <span className={styles.docNumber}>Документ № {invoice.number}</span>
                                                <span className={styles.docSupplier}>От: {invoice.supplierName}</span>
                                            </div>
                                            <span className={`${styles.statusBadge} ${status.class}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className={styles.docItemsTableWrapper}>
                                            <table className={styles.itemsTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Товар номенклатуры</th>
                                                        <th>План (Шт)</th>
                                                        <th>Факт на рампе (Шт)</th>
                                                        <th>Прогресс приёмки</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoice.items.map((item) => {
                                                        const isDone = item.acceptedQuantity === item.expectedQuantity;
                                                        return (
                                                            <tr 
                                                                key={item.id} 
                                                                className={isDone ? styles.itemRowDone : ''}
                                                            >
                                                                <td className={styles.itemNameText}>
                                                                    {item.productName} · <span className={styles.itemSkuText}>{item.productSku}</span>
                                                                </td>
                                                                <td>
                                                                    {item.expectedQuantity} шт.
                                                                </td>
                                                                <td className={isDone ? styles.textSuccess : styles.textWarning}>
                                                                    {item.acceptedQuantity} шт.
                                                                </td>
                                                                <td>
                                                                    {isDone ? (
                                                                        <span className={styles.doneBadge}>
                                                                            <CheckCircle2 size={12} />
                                                                            <span>Принято на 100%</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className={styles.waitBadge}>Ожидает ТСД сканера</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className={styles.docFooter}>
                                            <ClipboardList size={14} />
                                            <span>Создан в WMS: {new Date(invoice.createdAt).toLocaleString('ru-RU')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {invoices.length === 0 && (
                                <div className={styles.empty}>Журнал входящих накладных пуст.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}