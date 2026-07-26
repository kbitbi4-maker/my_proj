// ==========================================================================
// script.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
// Выравнивание: каждая колонка по своему самому длинному значению
// Строка 1 не влияет на ширину (или влияет отдельно)
// Поддержка переноса слов и ручного изменения размеров
// ==========================================================================

class TableManager {
    constructor() {
        this.apiUrl = localStorage.getItem('gt_api_url') || '';
        this.data = { 
            sheet1: { rows: [] },
            sheet2: { rows: [] },
            sheet3: { rows: [] },
            sheet4: { rows: [] }
        };
        this.currentSheet = 'sheet1';
        this.selectedCell = null;
        this.editingCell = null;
        
        // Настройки ширины колонок (сохраняются для каждого листа)
        this.columnWidths = JSON.parse(localStorage.getItem('gt_column_widths') || '{}');
        // Настройки высоты строк (сохраняются для каждого листа)
        this.rowHeights = JSON.parse(localStorage.getItem('gt_row_heights') || '{}');
        
        this.init();
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================
    init() {
        console.log('🚀 TableManager инициализирован');
        console.log('📡 API URL:', this.apiUrl);

        if (this.apiUrl) {
            this.loadData();
        } else {
            const loading = document.getElementById('loadingIndicator');
            if (loading) {
                loading.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="color: #ff9800;"></i>
                    <span>⚠️ Настройте API URL в разделе "Настройки"</span>
                `;
                loading.style.display = 'flex';
            }
        }

        this.bindEvents();
    }

    // ============================================================
    // ПРИВЯЗКА СОБЫТИЙ
    // ============================================================
    bindEvents() {
        document.getElementById('syncBtn').addEventListener('click', () => this.syncData());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadData());

        document.querySelectorAll('.main-nav li').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.main-nav li').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const page = item.dataset.page;
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(`page-${page}`).classList.add('active');
            });
        });

        const formulaInput = document.getElementById('formulaInput');
        formulaInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.applyFormula();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelFormula();
            }
        });

        document.getElementById('formulaConfirm').addEventListener('click', () => this.applyFormula());
        document.getElementById('formulaCancel').addEventListener('click', () => this.cancelFormula());

        document.querySelectorAll('.sheet-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.switchSheet(tab.dataset.sheet);
            });
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('editModal').classList.remove('active');
        });
        document.getElementById('cancelCellBtn').addEventListener('click', () => {
            document.getElementById('editModal').classList.remove('active');
        });
        document.getElementById('saveCellBtn').addEventListener('click', () => {
            this.saveCellValue();
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            const url = document.getElementById('apiUrl').value.trim();
            if (url) {
                this.apiUrl = url;
                localStorage.setItem('gt_api_url', url);
                alert('✅ Настройки сохранены!');
                this.loadData();
            } else {
                alert('❌ Введите корректный URL');
            }
        });

        if (this.apiUrl) {
            document.getElementById('apiUrl').value = this.apiUrl;
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('editModal').classList.remove('active');
            }
            if (this.selectedCell && !document.querySelector('.modal.active')) {
                this.handleArrowKeys(e);
            }
        });
    }

    // ============================================================
    // НАВИГАЦИЯ СТРЕЛКАМИ
    // ============================================================
    handleArrowKeys(e) {
        const { row, col } = this.selectedCell;
        const currentData = this.data[this.currentSheet];
        const maxRow = currentData.rows.length;
        const maxCol = currentData.rows.length > 0 ? currentData.rows[0].length : 0;

        let newRow = row;
        let newCol = col;

        switch(e.key) {
            case 'ArrowUp': newRow = Math.max(1, row - 1); break;
            case 'ArrowDown': newRow = Math.min(maxRow, row + 1); break;
            case 'ArrowLeft': newCol = Math.max(1, col - 1); break;
            case 'ArrowRight': newCol = Math.min(maxCol, col + 1); break;
            default: return;
        }

        e.preventDefault();

        if (newRow !== row || newCol !== col) {
            this.selectCell(newRow, newCol);
        }
    }

    // ============================================================
    // ПОЛУЧЕНИЕ БУКВЫ КОЛОНКИ
    // ============================================================
    getColumnLetter(index) {
        let letter = '';
        while (index >= 0) {
            letter = String.fromCharCode(65 + (index % 26)) + letter;
            index = Math.floor(index / 26) - 1;
        }
        return letter;
    }

    // ============================================================
    // ВЫДЕЛЕНИЕ ЯЧЕЙКИ
    // ============================================================
    selectCell(row, col) {
        document.querySelectorAll('.cell-selected, .row-selected, .col-selected')
            .forEach(el => el.classList.remove('cell-selected', 'row-selected', 'col-selected'));

        this.selectedCell = { row, col };

        const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('cell-selected');
            
            const rowElement = cell.closest('tr');
            if (rowElement) {
                rowElement.querySelectorAll('td').forEach(td => {
                    if (!td.classList.contains('cell-selected')) {
                        td.classList.add('row-selected');
                    }
                });
            }
            
            document.querySelectorAll(`td[data-col="${col}"]`).forEach(td => {
                if (!td.classList.contains('cell-selected')) {
                    td.classList.add('col-selected');
                }
            });
            
            const columnLetter = this.getColumnLetter(col - 1);
            document.getElementById('cellReference').textContent = `${columnLetter}${row}`;
            
            const currentData = this.data[this.currentSheet];
            const rowIndex = row - 1;
            let value = '';
            if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
                value = currentData.rows[rowIndex]?.[col - 1] || '';
            }
            document.getElementById('formulaInput').value = value;
            
            document.getElementById('cellInfo').textContent = `Выбрано: ${columnLetter}${row}`;
        }
    }

    // ============================================================
    // ПРИМЕНЕНИЕ ФОРМУЛЫ
    // ============================================================
    async applyFormula() {
        if (!this.selectedCell) return;

        const value = document.getElementById('formulaInput').value.trim();
        const { row, col } = this.selectedCell;

        this.editingCell = { row, col };
        document.getElementById('cellInput').value = value;
        await this.saveCellValue();
    }

    cancelFormula() {
        if (this.selectedCell) {
            const { row, col } = this.selectedCell;
            const currentData = this.data[this.currentSheet];
            const rowIndex = row - 1;
            let value = '';
            if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
                value = currentData.rows[rowIndex]?.[col - 1] || '';
            }
            document.getElementById('formulaInput').value = value;
        }
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
        loading.style.display = 'flex';
        loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка данных...';

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
                this.showSyncStatus(true);
                loading.style.display = 'none';

                if (this.data[this.currentSheet].rows.length > 0) {
                    this.selectCell(1, 1);
                }
            } else {
                throw new Error('Неизвестная структура ответа');
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            loading.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                <span>❌ Ошибка: ${error.message}</span>
            `;
            loading.style.display = 'flex';
            this.showSyncStatus(false);
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
        this.renderTable();
        this.updateStats();
        const currentData = this.data[this.currentSheet];
        if (currentData.rows.length > 0) {
            this.selectCell(1, 1);
        }
        const sheetLabels = { sheet1: 'Лист 1', sheet2: 'Лист 2', sheet3: 'Лист 3', sheet4: 'Лист 4' };
        document.getElementById('sheetNameDisplay').textContent = sheetLabels[sheetName] || sheetName;
    }

    // ============================================================
    // ОТРИСОВКА ТАБЛИЦЫ (С ПРАВИЛЬНЫМ ВЫРАВНИВАНИЕМ)
    // ============================================================
    renderTable() {
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        const currentData = this.data[this.currentSheet] || { rows: [] };
        const rows = currentData.rows || [];

        // Определяем максимальное количество колонок
        let maxCols = 0;
        rows.forEach(row => {
            if (row && row.length > maxCols) maxCols = row.length;
        });

        // ---- ВЫЧИСЛЯЕМ ШИРИНУ КАЖДОЙ КОЛОНКИ (по данным БЕЗ строки 1) ----
        const colWidths = [];
        const headerRow = rows.length > 0 ? rows[0] : []; // Строка 1 (названия)
        const dataRows = rows.slice(1); // Все остальные строки

        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
            let maxLength = 0;
            
            // Проверяем только строки данных (со 2-й по последнюю)
            dataRows.forEach(row => {
                if (row && row[colIndex] !== undefined && row[colIndex] !== null) {
                    const text = String(row[colIndex]);
                    // Длина в символах (для кириллицы и латиницы)
                    const length = this.getStringWidth(text);
                    if (length > maxLength) maxLength = length;
                }
            });

            // Если в колонке нет данных, ставим минимальную ширину
            if (maxLength === 0) maxLength = 8;

            // Сохраняем ширину для этой колонки (в пикселях)
            // 1 символ ≈ 8 пикселей + отступы
            let width = Math.max(80, Math.min(maxLength * 8 + 20, 400));
            
            // Если есть ручная настройка ширины — используем её
            const sheetKey = `${this.currentSheet}`;
            if (this.columnWidths[sheetKey] && this.columnWidths[sheetKey][colIndex] !== undefined) {
                width = this.columnWidths[sheetKey][colIndex];
            }
            
            colWidths.push(width);
        }

        // Сохраняем вычисленные ширины (если нет ручных настроек)
        const sheetKey = `${this.currentSheet}`;
        if (!this.columnWidths[sheetKey]) {
            this.columnWidths[sheetKey] = {};
            colWidths.forEach((width, index) => {
                this.columnWidths[sheetKey][index] = width;
            });
        }

        // ---- ЗАГОЛОВКИ КОЛОНОК (буквы) ----
        let headerHtml = '<tr><th class="row-header"></th>';
        for (let i = 0; i < maxCols; i++) {
            const letter = this.getColumnLetter(i);
            const width = colWidths[i] || 100;
            headerHtml += `<th style="min-width:${width}px; max-width:${width}px;">${letter}</th>`;
        }
        headerHtml += '</tr>';
        thead.innerHTML = headerHtml;

        // ---- ТЕЛО ТАБЛИЦЫ (все строки, включая строку 1) ----
        if (rows.length > 0) {
            let bodyHtml = '';
            rows.forEach((row, rowIndex) => {
                const actualRow = rowIndex + 1;
                
                // Проверяем, есть ли ручная высота для этой строки
                let rowHeight = '';
                if (this.rowHeights[sheetKey] && this.rowHeights[sheetKey][actualRow]) {
                    rowHeight = `height: ${this.rowHeights[sheetKey][actualRow]}px;`;
                }
                
                bodyHtml += `<tr style="${rowHeight}">`;
                bodyHtml += `<td class="row-header">${actualRow}</td>`;
                
                for (let colIndex = 0; colIndex < maxCols; colIndex++) {
                    const actualCol = colIndex + 1;
                    const value = row && row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '';
                    const width = colWidths[colIndex] || 100;
                    
                    bodyHtml += `<td data-row="${actualRow}" data-col="${actualCol}" 
                                   onclick="tableManager.selectCell(${actualRow}, ${actualCol})"
                                   ondblclick="tableManager.editCell(${actualRow}, ${actualCol})"
                                   style="min-width:${width}px; max-width:${width}px; word-wrap: break-word; white-space: normal; padding: 6px 8px;">
                                   ${value}</td>`;
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

        // Обновляем имя листа
        const sheetLabels = { sheet1: 'Лист 1', sheet2: 'Лист 2', sheet3: 'Лист 3', sheet4: 'Лист 4' };
        document.getElementById('sheetNameDisplay').textContent = sheetLabels[this.currentSheet] || this.currentSheet;
    }

    // ============================================================
    // ВСПОМОГАТЕЛЬНАЯ: РАСЧЕТ ШИРИНЫ СТРОКИ (с учетом кириллицы)
    // ============================================================
    getStringWidth(text) {
        if (!text) return 0;
        const str = String(text);
        let width = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            // Кириллица и латиница примерно одинаковой ширины
            // Широкие символы (W, M, Ж, Ш, Щ) — чуть шире
            if ('WMWMЖШЩ'.includes(char)) {
                width += 1.2;
            } else {
                width += 0.9;
            }
        }
        return Math.ceil(width);
    }

    // ============================================================
    // ИЗМЕНЕНИЕ ШИРИНЫ КОЛОНКИ (вручную)
    // ============================================================
    setColumnWidth(colIndex, width) {
        const sheetKey = `${this.currentSheet}`;
        if (!this.columnWidths[sheetKey]) {
            this.columnWidths[sheetKey] = {};
        }
        this.columnWidths[sheetKey][colIndex] = Math.max(60, Math.min(500, width));
        localStorage.setItem('gt_column_widths', JSON.stringify(this.columnWidths));
        this.renderTable();
    }

    // ============================================================
    // ИЗМЕНЕНИЕ ВЫСОТЫ СТРОКИ (вручную)
    // ============================================================
    setRowHeight(rowIndex, height) {
        const sheetKey = `${this.currentSheet}`;
        if (!this.rowHeights[sheetKey]) {
            this.rowHeights[sheetKey] = {};
        }
        this.rowHeights[sheetKey][rowIndex] = Math.max(24, Math.min(200, height));
        localStorage.setItem('gt_row_heights', JSON.stringify(this.rowHeights));
        this.renderTable();
    }

    // ============================================================
    // СБРОС РАЗМЕРОВ К НАСТРОЙКАМ ПО УМОЛЧАНИЮ
    // ============================================================
    resetSizes() {
        const sheetKey = `${this.currentSheet}`;
        delete this.columnWidths[sheetKey];
        delete this.rowHeights[sheetKey];
        localStorage.setItem('gt_column_widths', JSON.stringify(this.columnWidths));
        localStorage.setItem('gt_row_heights', JSON.stringify(this.rowHeights));
        this.renderTable();
    }

    // ============================================================
    // РЕДАКТИРОВАНИЕ ЯЧЕЙКИ
    // ============================================================
    editCell(row, col) {
        this.editingCell = { row, col };
        const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            document.getElementById('cellInput').value = cell.textContent.trim();
            document.getElementById('editModal').classList.add('active');
            setTimeout(() => document.getElementById('cellInput').focus(), 100);
        }
    }

    // ============================================================
    // СОХРАНЕНИЕ ЯЧЕЙКИ
    // ============================================================
    async saveCellValue() {
        const value = document.getElementById('cellInput').value.trim();
        const { row, col } = this.editingCell;

        if (!this.apiUrl) {
            alert('API URL не настроен');
            return;
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
                document.getElementById('editModal').classList.remove('active');
                document.getElementById('formulaInput').value = value;
                this.showToast('✅ Ячейка обновлена!');
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }

        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            alert('❌ Ошибка при сохранении: ' + error.message);
        }
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
        if (!this.selectedCell) {
            document.getElementById('cellInfo').textContent = 'Выбрано: —';
        }
    }

    // ============================================================
    // ОБНОВЛЕНИЕ СТРАНИЦЫ ОБЗОРА
    // ============================================================
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
    // СТАТУС СИНХРОНИЗАЦИИ
    // ============================================================
    showSyncStatus(success) {
        const status = document.querySelector('.sync-status');
        if (!status) return;
        if (success) {
            status.textContent = '✅ Синхр.';
            status.style.color = '#81c784';
        } else {
            status.textContent = '❌ Ошибка';
            status.style.color = '#ef9a9a';
        }
        setTimeout(() => {
            status.textContent = 'Синхр.';
            status.style.color = '';
        }, 3000);
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

let tableManager;
document.addEventListener('DOMContentLoaded', () => {
    tableManager = new TableManager();
});
