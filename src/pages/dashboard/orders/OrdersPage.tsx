// src/pages/dashboard/orders/OrdersPage.tsx
import React, { useState } from 'react';
import { useGetOrdersQuery, useCreateOrderMutation } from '@/features/orders/ordersApi';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { ShoppingCart, Plus, FilePlus, Truck, PackageCheck } from 'lucide-react';
import styles from './orders.module.scss';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
    'PENDING': { label: 'Ожидает сборки', class: styles.pending },
    'PROCESSING': { label: 'В процессе отбора', class: styles.processing },
    'COMPLETED': { label: 'Собрано и отгружено', class: styles.completed },
    'CANCELED': { label: 'Заказ отменен', class: styles.canceled }
};

export default function OrdersPage() {
    const { data: orders = [], isLoading } = useGetOrdersQuery();
    const { data: products = [] } = useGetProductsQuery();
    const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();

    const [orderNumber, setOrderNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
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

        const hasEmptyProduct = formItems.some(item => !item.productId);
        if (hasEmptyProduct) {
            setFormError('Выберите товар для каждой позиции заказа');
            return;
        }

        try {
            await createOrder({
                orderNumber: orderNumber.trim(),
                customerName: customerName.trim(),
                items: formItems
            }).unwrap();

            setOrderNumber('');
            setCustomerName('');
            setFormItems([{ productId: '', expectedQuantity: 1 }]);
        } catch (err: any) {
            setFormError(err?.data?.message || 'Ошибка создания заказа на отгрузку');
        }
    };

    return (
        <div className={styles.ordersPage}>
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <ShoppingCart size={28} />
                    <h2>Заказы и Отгрузка</h2>
                </div>
                <p>Выписка расходных спецификаций, контроль комплектации и прогресса физического отбора товаров</p>
            </div>

            <div className={styles.dashboardGrid}>
                {/* ЛЕВАЯ ЧАСТЬ: Выписка нового заказа */}
                <div className={styles.card}>
                    <h3>Выписать расходный заказ</h3>
                    <form onSubmit={handleSubmit} className={styles.orderForm}>
                        {formError && <div className={styles.errorMsg}>{formError}</div>}

                        <div className={styles.formGroup}>
                            <label>Внутренний номер заказа / Счета</label>
                            <input 
                                type="text" required placeholder="ЗАКАЗ-4412"
                                value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Получатель / Имя клиента</label>
                            <input 
                                type="text" required placeholder="ООО Магазин Авто-Евро"
                                value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>

                        <div className={styles.itemsSection}>
                            <label className={styles.sectionLabel}>Спецификация отгружаемых товаров</label>
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
                                <span>Добавить товар в спецификацию</span>
                            </button>
                        </div>

                        <button type="submit" disabled={isCreating} className={styles.addBtn}>
                            <FilePlus size={18} />
                            <span>{isCreating ? 'Сохранение...' : 'Сформировать заказ'}</span>
                        </button>
                    </form>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: Журнал расходных документов */}
                <div className={styles.cardTable}>
                    <h3>Журнал расходных ордеров ({orders.length})</h3>
                    {isLoading ? (
                        <div className={styles.loading}>Загрузка расходных документов...</div>
                    ) : (
                        <div className={styles.ordersList}>
                            {orders.map((order: any) => {
                                const status = STATUS_LABELS[order.status] || { label: order.status, class: '' };
                                return (
                                    <div key={order.id} className={styles.orderDocumentCard}>
                                        <div className={styles.docHeader}>
                                            <div className={styles.docMeta}>
                                                <span className={styles.docNumber}>Расходный ордер {order.orderNumber}</span>
                                                <span className={styles.docCustomer}>Клиент: {order.customerName}</span>
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
                                                        <th>Требуется (Шт)</th>
                                                        <th>Собрано с полок (Шт)</th>
                                                        <th>Статус отбора</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {order.items.map((item: any) => {
                                                        const isDone = item.pickedQuantity === item.expectedQuantity;
                                                        return (
                                                            <tr key={item.id} className={isDone ? styles.itemRowDone : ''}>
                                                                <td className={styles.itemNameText}>
                                                                    {item.productName} · <span className={styles.itemSkuText}>{item.productBrand} {item.productSku}</span>
                                                                </td>
                                                                <td>
                                                                    {item.expectedQuantity} шт.
                                                                </td>
                                                                <td className={isDone ? styles.textSuccess : styles.textWarning}>
                                                                    {item.pickedQuantity} шт.
                                                                </td>
                                                                <td>
                                                                    {isDone ? (
                                                                        <span className={styles.doneBadge}>
                                                                            <PackageCheck size={12} />
                                                                            <span>Укомплектовано</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className={styles.waitBadge}>В листе сборщика ТСД</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className={styles.docFooter}>
                                            <Truck size={14} />
                                            <span>Выписан менеджером: {new Date(order.createdAt).toLocaleString('ru-RU')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {orders.length === 0 && (
                                <div className={styles.empty}>Журнал расходных заказов пуст.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}