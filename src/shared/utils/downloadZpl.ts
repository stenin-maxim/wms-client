// src/shared/utils/downloadZpl.ts

/**
 * Создает текстовый Blob из строки ZPL и принудительно скачивает его через браузер.
 * @param zplCode — Строка с ZPL-командной разметкой для принтера Zebra
 * @param filename — Имя скачиваемого файла (например: label_product_333384.zpl)
 */
export const downloadZplFile = (zplCode: string, filename: string): void => {
    const blob = new Blob([zplCode], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = filename.endsWith('.zpl') ? filename : `${filename}.zpl`;
    
    document.body.appendChild(link);
    link.click();
    
    // Чистим память за собой (удаляем временную ссылку)
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};