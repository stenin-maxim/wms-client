import React from 'react';
import { LABEL_SIZES, type LabelSizeType } from '@/shared/constants/labels';
import styles from './labelSizeSelector.module.scss';

interface LabelSizeSelectorProps {
    value: LabelSizeType;
    onChange: (size: LabelSizeType) => void;
}

export const LabelSizeSelector: React.FC<LabelSizeSelectorProps> = ({ value, onChange }) => {
    return (
        <div className={styles.selectorWrapper}>
            <span className={styles.label}>Формат этикетки ZPL:</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as LabelSizeType)}
                className={styles.select}
            >
                {LABEL_SIZES.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
        </div>
    );
};