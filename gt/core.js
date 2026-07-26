// ============================================================
// core.js - ЯДРО ПРИЛОЖЕНИЯ
// Данные, API, рендеринг, управление размерами
// ============================================================

class TableCore {
    constructor() {
        this.apiUrl = localStorage.getItem('gt_api_url') || '';
        this.data = { 
            sheet1: { rows: [] },
            sheet2: { rows: [] },
            sheet3: { rows: [] },
            sheet4: { rows: [] }
        };
        this.currentSheet = 'sheet1';
        
        this.columnWidths = JSON.parse(localStorage.getItem('gt_column_widths') || '{}');
        this.rowHeights = JSON.parse(localStorage.getItem('gt_row_heights') || '{}');
    }

    // ============================================================
    // ЗАГРУЗКА ДАННЫХ
    // ============================================================
    async loadData() {
        if (!this.apiUrl) {
            alert('❌ Сначала настройте API URL в разделе "Настройки"');
            return;
        }

        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.style.display = 'flex';
            loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка данных...';
        }

        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);

            const text = await response.text();
            let result;
            try { result = JSON.parse(text); } 
            catch (e) { throw new Error(`Невалидный JSON: ${text.substring(0, 100)}...`); }

            if (result.sheet1 || result.sheet2 || result.sheet3 || result.sheet4) {
                ['sheet1', 'sheet2', 'sheet3', 'sheet4'].forEach(key => {
                    if (result[key] && result[key].length > 0) {
                        this.data[key] = { rows: result[key] };
                    } else {
                        this.data[key] = { rows: [] };
                    }
                });

                this.renderTable();
                this.updateStats();
                this.updateOverview();
                if (loading) loading.style.display = 'none';

                if (this.data[this.currentSheet].rows.length > 0) {
                    if (window.tableSelection && typeof window.tableSelection.selectCell === 'function') {
                        window.tableSelection.selectCell(1, 1);
                    } else {
                        console.warn('⚠️ tableSelection ещё не инициализирован, пропускаем selectCell');
                    }
                }
                return true;
            } else {
                throw new Error('Неизвестная структура ответа');
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            if (loading) {
                loading.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                    <span>❌ Ошибка: ${error.message}</span>
                `;
                loading.style.display = 'flex';
            }
            return false;
        }
    }

    // ============================================================
    // СИНХРОНИЗАЦИЯ
    // ============================================================
    async syncData() {
        const btn = document.getElementById('syncBtn');
        const icon = btn.querySelector('i');
        const status = btn.querySelector('.sync-status');
        
        icon.classList.add('fa-spin');
        status.textContent = 'Синхр...';
        btn.disabled = true;

        await this.loadData();

        icon.classList.remove('fa-spin');
        status.textContent = 'Синхр.';
        btn.disabled = false;
        btn.style.background = 'rgba(76, 175, 80, 0.4)';
        setTimeout(() => { btn.style.background = ''; }, 1000);
    }

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ ЛИСТА
    // ============================================================
    switchSheet(sheetName) {
        this.currentSheet = sheetName;
        if (window.tableSelection) {
            window.tableSelection.clearSelection();
        }
        this.renderTable();
        this.updateStats();
        const currentData = this.data[this.currentSheet];
        if (currentData.rows.length > 0 && window.tableSelection) {
            window.tableSelection.selectCell(1, 1);
        }
        const sheetLabels = { sheet1: 'Лист 1', sheet2: 'Лист 2', sheet3: 'Лист 3', sheet4: 'Лист 4' };
        document.getElementById('sheetNameDisplay').textContent = sheetLabels[sheetName] || sheetName;
    }

    // ============================================================
    // ОТРИСОВКА ТАБЛИЦЫ (БЕЗ onclick — только data-атрибуты)
    // ============================================================
    renderTable() {
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        const currentData = this.data[this.currentSheet] || { rows: [] };
        const rows = currentData.rows || [];

        let maxCols = 0;
        rows.forEach(row => {
            if (row && row.length > maxCols) maxCols = row.length;
        });

        const colWidths = this.calculateColumnWidths(rows, maxCols);
        this.saveColumnWidths(colWidths);

        // ---- ЗАГОЛОВКИ (БЕЗ onclick) ----
        let headerHtml = '<tr>';
        // Уголок — data-action="selectAll"
        headerHtml += `<th class="row-header corner-header" data-action="selectAll" title="Выделить всё">`;
        headerHtml += `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">`;
        headerHtml += `<i class="fas fa-caret-down" style="font-size:10px;color:#5f6368;"></i>`;
        headerHtml += `</div></th>`;
        
        for (let i = 0; i < maxCols; i++) {
            const letter = this.getColumnLetter(i);
            const width = colWidths[i] || 100;
            // Колонки — data-action="selectColumn" и data-col-index
            headerHtml += `<th class="col-header" data-action="selectColumn" data-col-index="${i + 1}" data-letter="${letter}" 
                           style="min-width:${width}px; max-width:${width}px; cursor:pointer;">
                           ${letter}</th>`;
        }
        headerHtml += '</tr>';
        thead.innerHTML = headerHtml;

        // ---- ТЕЛО ТАБЛИЦЫ (БЕЗ onclick) ----
        if (rows.length > 0) {
            let bodyHtml = '';
            const sheetKey = `${this.currentSheet}`;
            rows.forEach((row, rowIndex) => {
                const actualRow = rowIndex + 1;
                
                let rowHeight = '';
                if (this.rowHeights[sheetKey] && this.rowHeights[sheetKey][actualRow]) {
                    rowHeight = `height: ${this.rowHeights[sheetKey][actualRow]}px;`;
                }
                
                bodyHtml += `<tr style="${rowHeight}">`;
                // Номер строки — data-action="selectRow"
                bodyHtml += `<td class="row-header" data-action="selectRow" data-row-index="${actualRow}" 
                              style="cursor:pointer;">${actualRow}</td>`;
                
                for (let colIndex = 0; colIndex < maxCols; colIndex++) {
                    const actualCol = colIndex + 1;
                    const value = row && row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '';
                    const width = colWidths[colIndex] || 100;
                    
                    bodyHtml += `<td data-row="${actualRow}" data-col="${actualCol}" 
                                   class="data-cell"
                                   style="min-width:${width}px; max-width:${width}px; 
                                          word-wrap: break-word; white-space: normal; padding: 6px 8px;
                                          cursor: cell; user-select: none;">${value}</td>`;
                }
                bodyHtml += '</tr>';
            });
            tbody.innerHTML = bodyHtml;
        } else {
            bodyHtml = `<tr>
                <td class="row-header">1</td>
                <td colspan="${Math.max(maxCols, 1)}" style="text-align:center; padding:20px; color:#999;">
                    Нет данных для отображения
                </td>
            </tr>`;
            tbody.innerHTML = bodyHtml;
        }

        // Восстанавливаем выделение
        if (window.tableSelection && window.tableSelection.selectionRange) {
            window.tableSelection.updateSelectionVisual();
        }

        const sheetLabels = { sheet1: 'Лист 1', sheet2: 'Лист 2', sheet3: 'Лист 3', sheet4: 'Лист 4' };
        document.getElementById('sheetNameDisplay').textContent = sheetLabels[this.currentSheet] || this.currentSheet;
    }

    // ============================================================
    // РАСЧЕТ ШИРИНЫ КОЛОНОК
    // ============================================================
    calculateColumnWidths(rows, maxCols) {
        const colWidths = [];
        const dataRows = rows.slice(1);

        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
            let maxLength = 0;
            dataRows.forEach(row => {
                if (row && row[colIndex] !== undefined && row[colIndex] !== null) {
                    const text = String(row[colIndex]);
                    const length = this.getStringWidth(text);
                    if (length > maxLength) maxLength = length;
                }
            });
            if (maxLength === 0) maxLength = 8;
            let width = Math.max(80, Math.min(maxLength * 8 + 20, 400));
            
            const sheetKey = `${this.currentSheet}`;
            if (this.columnWidths[sheetKey] && this.columnWidths[sheetKey][colIndex] !== undefined) {
                width = this.columnWidths[sheetKey][colIndex];
            }
            colWidths.push(width);
        }
        return colWidths;
    }

    saveColumnWidths(colWidths) {
        const sheetKey = `${this.currentSheet}`;
        if (!this.columnWidths[sheetKey]) {
            this.columnWidths[sheetKey] = {};
            colWidths.forEach((width, index) => {
                this.columnWidths[sheetKey][index] = width;
            });
        }
    }

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================
    getColumnLetter(index) {
        let letter = '';
        while (index >= 0) {
            letter = String.fromCharCode(65 + (index % 26)) + letter;
            index = Math.floor(index / 26) - 1;
        }
        return letter;
    }

    getColumnIndex(letter) {
        if (!letter) return -1;
        const cleanLetter = letter.trim().toUpperCase();
        let index = 0;
        for (let i = 0; i < cleanLetter.length; i++) {
            index = index * 26 + (cleanLetter.charCodeAt(i) - 64);
        }
        return index - 1;
    }

    getStringWidth(text) {
        if (!text) return 0;
        const str = String(text);
        let width = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if ('WMWMЖШЩ'.includes(char)) {
                width += 1.2;
            } else {
                width += 0.9;
            }
        }
        return Math.ceil(width);
    }

    // ============================================================
    // УПРАВЛЕНИЕ РАЗМЕРАМИ
    // ============================================================
    setColumnWidth(colIndex, width) {
        const sheetKey = `${this.currentSheet}`;
        if (!this.columnWidths[sheetKey]) {
            this.columnWidths[sheetKey] = {};
        }
        this.columnWidths[sheetKey][colIndex] = Math.max(60, Math.min(500, width));
        localStorage.setItem('gt_column_widths', JSON.stringify(this.columnWidths));
        this.renderTable();
        this.showToast(`✅ Ширина колонки ${this.getColumnLetter(colIndex)} установлена: ${width}px`);
    }

    setRowHeight(rowIndex, height) {
        const sheetKey = `${this.currentSheet}`;
        if (!this.rowHeights[sheetKey]) {
            this.rowHeights[sheetKey] = {};
        }
        this.rowHeights[sheetKey][rowIndex] = Math.max(24, Math.min(200, height));
        localStorage.setItem('gt_row_heights', JSON.stringify(this.rowHeights));
        this.renderTable();
        this.showToast(`✅ Высота строки ${rowIndex} установлена: ${height}px`);
    }

    resetSizes() {
        const sheetKey = `${this.currentSheet}`;
        delete this.columnWidths[sheetKey];
        delete this.rowHeights[sheetKey];
        localStorage.setItem('gt_column_widths', JSON.stringify(this.columnWidths));
        localStorage.setItem('gt_row_heights', JSON.stringify(this.rowHeights));
        this.renderTable();
        this.showToast('✅ Размеры сброшены к настройкам по умолчанию');
    }

    // ============================================================
    // ОБНОВЛЕНИЕ СТАТИСТИКИ
    // ============================================================
    updateStats() {
        const currentData = this.data[this.currentSheet] || { rows: [] };
        const rowCount = currentData.rows.length;
        const colCount = currentData.rows.length > 0 ? currentData.rows[0].length : 0;
        document.getElementById('rowCount').textContent = `Строк: ${rowCount}`;
        document.getElementById('colCount').textContent = `Колонок: ${colCount}`;
        document.getElementById('lastSync').textContent = 
            `Последняя синхронизация: ${new Date().toLocaleString()}`;
    }

    updateOverview() {
        let totalRecords = 0;
        ['sheet1', 'sheet2', 'sheet3', 'sheet4'].forEach(key => {
            totalRecords += this.data[key].rows.length;
        });
        document.getElementById('totalRecords').textContent = totalRecords;
        document.getElementById('dataStatus').textContent = 
            totalRecords > 0 ? '✅ Данные загружены' : '⏳ Нет данных';
    }

    // ============================================================
    // СОХРАНЕНИЕ ЯЧЕЙКИ
    // ============================================================
    async saveCellValue(row, col, value) {
        if (!this.apiUrl) {
            alert('API URL не настроен');
            return false;
        }

        const sheetNumber = this.currentSheet.replace('sheet', '');

        try {
            const jsonData = {
                action: 'updateCell',
                sheet: sheetNumber,
                row: row,
                col: col,
                value: value
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(jsonData)
            });

            const text = await response.text();
            let result;
            try { result = JSON.parse(text); } 
            catch (e) { throw new Error('Сервер вернул невалидный ответ'); }

            if (result.success) {
                const currentData = this.data[this.currentSheet];
                const rowIndex = row - 1;
                if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
                    if (currentData.rows[rowIndex].length < col) {
                        currentData.rows[rowIndex].length = col;
                    }
                    currentData.rows[rowIndex][col - 1] = value;
                }
                this.renderTable();
                return true;
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }

        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            alert('❌ Ошибка при сохранении: ' + error.message);
            return false;
        }
    }

    // ============================================================
    // TOAST УВЕДОМЛЕНИЕ
    // ============================================================
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #323232; color: white; padding: 10px 22px;
            border-radius: 8px; font-size: 13px; z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeIn 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 2500);
    }
}
