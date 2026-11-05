// src/pages/dashboard/products/ProductsPage.tsx
import React, { useState } from 'react';
import {
    useGetProductsQuery,
    useCreateProductMutation,
    useDeleteProductMutation,
    useLazyGetProductLabelQuery
} from '@/features/products/productsApi';
import { Wrench, Plus, Trash2, Printer, Barcode } from 'lucide-react';
import { downloadZplFile } from '@/shared/utils/downloadZpl';
import styles from './products.module.scss';

export default function ProductsPage() {
    const { data: products = [], isLoading } = useGetProductsQuery();
    const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
    const [deleteProduct] = useDeleteProductMutation();
    const [triggerGetLabel] = useLazyGetProductLabelQuery();

    // Стейты формы номенклатуры
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [brand, setBrand] = useState('');
    const [barcode, setBarcode] = useState('');
    const [formError, setFormError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        try {
            await createProduct({
                name: name.trim(),
                sku: sku.trim().toUpperCase(), // Артикулы всегда в верхнем регистре
                brand: brand.trim(),
                barcode: barcode.trim() || undefined
            }).unwrap();

            setName('');
            setSku('');
            setBrand('');
            setBarcode('');
        } catch (err: any) {
            setFormError(err?.data?.message || 'Ошибка создания карточки товара');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Вы уверены, что хотите удалить ${name} из каталога?`)) {
            try {
                await deleteProduct(id).unwrap();
            } catch (err: any) {
                alert(err?.data?.message || 'Не удалось удалить деталь. Возможно, она есть на остатках ячеек.');
            }
        }
    };

    const handlePrintLabel = async (id: string, sku: string) => {
        try {
            const res = await triggerGetLabel(id).unwrap();
            downloadZplFile(res.zplCode, `label_product_${sku}`); // Вызываем единый хелпер скачивания
        } catch (err) {
            alert('Не удалось сгенерировать ценник ZPL');
        }
    };

    return (
        <div className={styles.partsPage}>
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <Wrench size={28} />
                    <h2>Номенклатура автозапчастей</h2>
                </div>
                <p>Каталог деталей, уникальных артикулов SKU и управление штрихкодами маркировки</p>
            </div>

            <div className={styles.dashboardGrid}>
                {/* ЛЕВАЯ ЧАСТЬ: Заведение детали */}
                <div className={styles.card}>
                    <h3>Добавить деталь в каталог</h3>
                    <form onSubmit={handleCreate} className={styles.productForm}>
                        {formError && <div className={styles.errorMsg}>{formError}</div>}

                        <div className={styles.formGroup}>
                            <label>Производитель / Бренд</label>
                            <input 
                                type="text" required placeholder="KYB, Brembo, Hyundai"
                                value={brand} onChange={(e) => setBrand(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Заводской артикул (SKU)</label>
                            <input 
                                type="text" required placeholder="333384"
                                value={sku} onChange={(e) => setSku(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Наименование товара</label>
                            <input 
                                type="text" required placeholder="Амортизатор передний левый"
                                value={name} onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Заводской штрихкод (EAN/UPC)</label>
                            <input 
                                type="text" placeholder="4909500531542 (Опционально)"
                                value={barcode} onChange={(e) => setBarcode(e.target.value)}
                            />
                        </div>

                        <button type="submit" disabled={isCreating} className={styles.addBtn}>
                            <Plus size={18} />
                            <span>{isCreating ? 'Сохранение...' : 'Завести в базу'}</span>
                        </button>
                    </form>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: Таблица каталога */}
                <div className={styles.cardTable}>
                    <h3>Зарегистрировано номенклатуры ({products.length})</h3>
                    {isLoading ? (
                        <div className={styles.loading}>Загрузка базы товаров...</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.wmsTable}>
                                <thead>
                                    <tr>
                                        <th>Бренд / Артикул</th>
                                        <th>Наименование товара</th>
                                        <th>Штрихкод детали</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((prod) => (
                                        <tr key={prod.id}>
                                            <td>
                                                <div className={styles.skuBlock}>
                                                    <span className={styles.brandText}>{prod.brand}</span>
                                                    <span className={styles.skuText}>{prod.sku}</span>
                                                </div>
                                            </td>
                                            <td className={styles.nameText}>{prod.name}</td>
                                            <td data-label="Штрихкод">
                                                {prod.barcode ? (
                                                    <div className={styles.barcodeWrapper}>
                                                        <Barcode size={14} />
                                                        <span className={styles.code}>{prod.barcode}</span>
                                                    </div>
                                                ) : (
                                                    <span className={styles.noBarcode}>Отсутствует (Используется SKU)</span>
                                                )}
                                            </td>
                                            <td className={styles.actions}>
                                                <button 
                                                    onClick={() => handlePrintLabel(prod.id, prod.sku)}
                                                    className={`${styles.actionBtn} ${styles.print}`}
                                                    title="Скачать ZPL этикетку для принтера"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(prod.id, prod.name)}
                                                    className={`${styles.actionBtn} ${styles.delete}`}
                                                    title="Удалить деталь из системы"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className={styles.empty}>Каталог товаров пуст. Заведите первый товар.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}