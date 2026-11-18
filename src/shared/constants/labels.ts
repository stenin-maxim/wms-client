export type LabelSizeType = 'SIZE_58X40' | 'SIZE_75X50' | 'SIZE_100X150';

export const LABEL_SIZES: { value: LabelSizeType; label: string }[] = [
    { value: 'SIZE_58X40', label: '58 × 40 мм (Стандарт)' },
    { value: 'SIZE_75X50', label: '75 × 50 мм (Средняя)' },
    { value: 'SIZE_100X150', label: '100 × 150 мм (Крупная)' }
];