// ============================================================
// clipboard.js - КОПИРОВАНИЕ, ВСТАВКА, ОЧИСТКА, ЗАМЕНА
// ============================================================

class TableClipboard {
    constructor(core, selection) {
        this.core = core;
        this.selection = selection;
        this.clipboardData = null;
    }

    // ============================================================
    // КОПИРОВАНИЕ
    // ============================================================
    copySelection() {
        if (!this.selection.selectionRange) {
            this.core.showToast('⚠️ Нет выделенных ячеек для копирования');
            console.log('❌ Нет выделенных ячеек');
            return;
        }

        console.log('📋 Начинаем копирование...');
        console.log('📋 selectionRange:', this.selection.selectionRange);

        const { startRow, startCol, endRow, endCol } = this.selection.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        console.log(`📋 Диапазон: строки ${minRow}-${maxRow}, колонки ${minCol}-${maxCol}`);

        const currentData = this.core.data[this.core.currentSheet];
        const copiedData = [];
        let cellCount = 0;

        for (let r = minRow; r <= maxRow; r++) {
            const rowData = [];
            for (let c = minCol; c <= maxCol; c++) {
                const rowIndex = r - 1;
                let value = '';
                if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
                    const cellValue = currentData.rows[rowIndex]?.[c - 1];
                    value = (cellValue !== undefined && cellValue !== null) ? String(cellValue) : '';
                }
                rowData.push(value);
                if (value !== '') cellCount++;
            }
            copiedData.push(rowData);
        }

        this.clipboardData = {
            data: copiedData,
            rows: copiedData.length,
            cols: copiedData[0]?.length || 0
        };

        const textRepresentation = copiedData.map(row => row.join('\t')).join('\n');
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textRepresentation)
                .then(() => {
                    console.log('✅ Скопировано в системный буфер обмена');
                })
                .catch(() => {
                    this.fallbackCopy(textRepresentation);
                });
        } else {
            this.fallbackCopy(textRepresentation);
        }

        const rows = copiedData.length;
        const cols = copiedData[0]?.length || 0;
        this.core.showToast(`✅ Скопировано: ${rows} × ${cols} ячеек (${cellCount} непустых)`);
        console.log('📋 clipboardData:', this.clipboardData);
    }

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        try {
            document.execCommand('copy');
            console.log('✅ Fallback: скопировано');
        } catch (err) {
            console.error('❌ Fallback ошибка:', err);
        }
        document.body.removeChild(textarea);
    }

    // ============================================================
    // ВСТАВКА
    // ============================================================
    async pasteSelection() {
        if (!this.clipboardData) {
            this.core.showToast('⚠️ Буфер обмена пуст. Сначала скопируйте ячейки (Ctrl+C)');
            return;
        }

        if (!this.selection.selectedCell) {
            this.core.showToast('⚠️ Выберите целевую ячейку для вставки');
            return;
        }

        console.log('📋 Вставка данных:', this.clipboardData);

        const targetRow = this.selection.selectedCell.row;
        const targetCol = this.selection.selectedCell.col;
        const { data, rows, cols } = this.clipboardData;

        const sheetNumber = this.core.currentSheet.replace('sheet', '');
        const currentData = this.core.data[this.core.currentSheet];
        const updates = [];

        for (let r = 0; r < rows; r++) {
            const rowIndex = targetRow + r - 1;
            if (rowIndex >= currentData.rows.length) {
                currentData.rows.push([]);
            }
            for (let c = 0; c < cols; c++) {
                const colIndex = targetCol + c - 1;
                const value = data[r]?.[c] || '';
                if (currentData.rows[rowIndex].length < colIndex + 1) {
                    currentData.rows[rowIndex].length = colIndex + 1;
                }
                currentData.rows[rowIndex][colIndex] = value;
                updates.push({ row: targetRow + r, col: targetCol + c, value: value });
            }
        }

        try {
            for (const update of updates) {
                const jsonData = {
                    action: 'updateCell',
                    sheet: sheetNumber,
                    row: update.row,
                    col: update.col,
                    value: update.value
                };
                await fetch(this.core.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(jsonData)
                });
            }
            this.core.renderTable();
            this.core.showToast(`✅ Вставлено: ${rows} × ${cols} ячеек`);
            console.log(`✅ Вставлено: ${rows} × ${cols} ячеек`);
        } catch (error) {
            console.error('❌ Ошибка вставки:', error);
            this.core.showToast('❌ Ошибка при вставке данных');
        }
    }

    // ============================================================
    // ОЧИСТКА
    // ============================================================
    async clearSelectedCells() {
        if (!this.selection.selectionRange) {
            this.core.showToast('⚠️ Нет выделенных ячеек для очистки');
            return;
        }

        const { startRow, startCol, endRow, endCol } = this.selection.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        const sheetNumber = this.core.currentSheet.replace('sheet', '');
        const currentData = this.core.data[this.core.currentSheet];
        const updates = [];

        for (let r = minRow; r <= maxRow; r++) {
            const rowIndex = r - 1;
            if (rowIndex >= currentData.rows.length) continue;
            for (let c = minCol; c <= maxCol; c++) {
                const colIndex = c - 1;
                if (colIndex >= currentData.rows[rowIndex].length) continue;
                
                currentData.rows[rowIndex][colIndex] = '';
                updates.push({ row: r, col: c, value: '' });
            }
        }

        try {
            for (const update of updates) {
                const jsonData = {
                    action: 'updateCell',
                    sheet: sheetNumber,
                    row: update.row,
                    col: update.col,
                    value: ''
                };
                await fetch(this.core.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(jsonData)
                });
            }
            this.core.renderTable();
            this.core.showToast(`✅ Очищено: ${updates.length} ячеек`);
        } catch (error) {
            console.error('❌ Ошибка очистки:', error);
            this.core.showToast('❌ Ошибка при очистке ячеек');
        }
    }

    // ============================================================
    // ЗАМЕНА В ВЫДЕЛЕННЫХ ЯЧЕЙКАХ
    // ============================================================
    async replaceInSelection(findText, replaceText) {
        if (!this.selection.selectionRange) {
            this.core.showToast('⚠️ Нет выделенных ячеек');
            return;
        }

        if (!findText || findText === '') {
            this.core.showToast('⚠️ Введите текст для поиска');
            return;
        }

        const { startRow, startCol, endRow, endCol } = this.selection.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        const sheetNumber = this.core.currentSheet.replace('sheet', '');
        const currentData = this.core.data[this.core.currentSheet];
        const updates = [];
        let replacedCount = 0;

        for (let r = minRow; r <= maxRow; r++) {
            const rowIndex = r - 1;
            if (rowIndex >= currentData.rows.length) continue;
            for (let c = minCol; c <= maxCol; c++) {
                const colIndex = c - 1;
                if (colIndex >= currentData.rows[rowIndex].length) continue;
                
                const currentValue = String(currentData.rows[rowIndex][colIndex] || '');
                if (currentValue.includes(findText)) {
                    const newValue = currentValue.replaceAll(findText, replaceText);
                    currentData.rows[rowIndex][colIndex] = newValue;
                    updates.push({ row: r, col: c, value: newValue });
                    replacedCount++;
                }
            }
        }

        if (replacedCount === 0) {
            this.core.showToast('⚠️ Текст "' + findText + '" не найден в выделенных ячейках');
            return;
        }

        try {
            for (const update of updates) {
                const jsonData = {
                    action: 'updateCell',
                    sheet: sheetNumber,
                    row: update.row,
                    col: update.col,
                    value: update.value
                };
                await fetch(this.core.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(jsonData)
                });
            }
            this.core.renderTable();
            this.core.showToast(`✅ Заменено в ${replacedCount} ячейках`);
        } catch (error) {
            console.error('❌ Ошибка замены:', error);
            this.core.showToast('❌ Ошибка при замене значений');
        }
    }

    // ============================================================
    // МАССОВОЕ ЗАПОЛНЕНИЕ
    // ============================================================
    async fillSelection(value) {
        if (!this.selection.selectionRange) {
            this.core.showToast('⚠️ Нет выделенных ячеек');
            return;
        }

        if (value === undefined || value === null) {
            this.core.showToast('⚠️ Введите значение для заполнения');
            return;
        }

        const { startRow, startCol, endRow, endCol } = this.selection.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        const sheetNumber = this.core.currentSheet.replace('sheet', '');
        const currentData = this.core.data[this.core.currentSheet];
        const updates = [];

        for (let r = minRow; r <= maxRow; r++) {
            const rowIndex = r - 1;
            if (rowIndex >= currentData.rows.length) {
                currentData.rows.push([]);
            }
            for (let c = minCol; c <= maxCol; c++) {
                const colIndex = c - 1;
                if (currentData.rows[rowIndex].length < colIndex + 1) {
                    currentData.rows[rowIndex].length = colIndex + 1;
                }
                currentData.rows[rowIndex][colIndex] = value;
                updates.push({ row: r, col: c, value: value });
            }
        }

        try {
            for (const update of updates) {
                const jsonData = {
                    action: 'updateCell',
                    sheet: sheetNumber,
                    row: update.row,
                    col: update.col,
                    value: update.value
                };
                await fetch(this.core.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(jsonData)
                });
            }
            this.core.renderTable();
            this.core.showToast(`✅ Заполнено ${updates.length} ячеек значением "${value}"`);
        } catch (error) {
            console.error('❌ Ошибка заполнения:', error);
            this.core.showToast('❌ Ошибка при заполнении ячеек');
        }
    }
}
