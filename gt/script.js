// ==========================================================================
// script.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
// Строка 1 теперь отображается как обычные данные, а не как заголовки
// Авто-выравнивание ширины колонок
// ==========================================================================

class TableManager {
    constructor() {
        this.apiUrl = localStorage.getItem('gt_api_url') || '';
        this.data = { 
            sheet1: { rows: [] },  // Теперь rows содержит ВСЕ строки, включая строку 1
            sheet2: { rows: [] },
            sheet3: { rows: [] },
            sheet4: { rows: [] }
        };
        this.currentSheet = 'sheet1';
        this.selectedCell = null;
        this.editingCell = null;
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
        const maxRow = currentData.rows.length;  // Все строки включая строку 1
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
            const rowIndex = row - 1;  // Теперь строка 1 — это индекс 0
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
    // ЗАГРУЗКА ДАННЫХ (GET)
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
                        // Сохраняем ВСЕ строки как есть (включая строку 1)
                        this.data[key] = {
                            rows: result[key]  // Теперь это ВСЕ строки
                        };
                    } else {
                        this.data[key] = { rows: [] };
                    }
                });

                this.renderTable();
                this.updateStats();
                this.updateOverview();
                this.showSyncStatus(true);
                loading.style.display = 'none';

                // Выбираем первую ячейку (строка 1, колонка 1)
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
    // ОТРИСОВКА ТАБЛИЦЫ (Строка 1 теперь как обычные данные)
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

        // ---- ЗАГОЛОВКИ КОЛОНОК (буквы) ----
        let headerHtml = '<tr><th class="row-header"></th>';
        for (let i = 0; i < maxCols; i++) {
            const letter = this.getColumnLetter(i);
            headerHtml += `<th>${letter}</th>`;
        }
        headerHtml += '</tr>';
        thead.innerHTML = headerHtml;

        // ---- ТЕЛО ТАБЛИЦЫ (все строки, включая строку 1) ----
        if (rows.length > 0) {
            let bodyHtml = '';
            rows.forEach((row, rowIndex) => {
                const actualRow = rowIndex + 1;  // Строка 1, 2, 3, ...
                bodyHtml += `<tr>`;
                bodyHtml += `<td class="row-header">${actualRow}</td>`;
                for (let colIndex = 0; colIndex < maxCols; colIndex++) {
                    const actualCol = colIndex + 1;
                    const value = row && row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '';
                    bodyHtml += `<td data-row="${actualRow}" data-col="${actualCol}" 
                                   onclick="tableManager.selectCell(${actualRow}, ${actualCol})"
                                   ondblclick="tableManager.editCell(${actualRow}, ${actualCol})"
                                   style="min-width: 80px; max-width: 300px;">
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

        // ---- АВТО-ВЫРАВНИВАНИЕ ШИРИНЫ КОЛОНОК ----
        this.autoFitColumns();

        // Обновляем имя листа
        const sheetLabels = { sheet1: 'Лист 1', sheet2: 'Лист 2', sheet3: 'Лист 3', sheet4: 'Лист 4' };
        document.getElementById('sheetNameDisplay').textContent = sheetLabels[this.currentSheet] || this.currentSheet;
    }

    // ============================================================
    // АВТО-ВЫРАВНИВАНИЕ ШИРИНЫ КОЛОНОК
    // ============================================================
    autoFitColumns() {
        const table = document.getElementById('dataTable');
        if (!table) return;

        const rows = table.querySelectorAll('tr');
        if (rows.length < 2) return;

        // Получаем все ячейки в каждой колонке
        const colCount = rows[0].querySelectorAll('td, th').length;
        const colMaxLengths = new Array(colCount).fill(0);

        // Проходим по всем строкам и ячейкам
        rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            cells.forEach((cell, index) => {
                if (index < colCount) {
                    const text = cell.textContent || '';
                    // Учитываем, что в заголовках (буквы) текст короче
                    const isHeader = cell.tagName === 'TH';
                    const length = isHeader ? Math.max(text.length, 2) : text.length;
                    if (length > colMaxLengths[index]) {
                        colMaxLengths[index] = length;
                    }
                }
            });
        });

        // Устанавливаем ширину колонок (в пикселях, с запасом)
        const colElements = table.querySelectorAll('colgroup');
        if (colElements.length === 0) {
            // Создаем colgroup если его нет
            const colgroup = document.createElement('colgroup');
            table.prepend(colgroup);
            for (let i = 0; i < colCount; i++) {
                const col = document.createElement('col');
                const width = Math.max(60, colMaxLengths[i] * 8 + 20);
                col.style.width = Math.min(width, 300) + 'px';
                colgroup.appendChild(col);
            }
        } else {
            // Обновляем существующий colgroup
            const colgroup = colElements[0];
            const cols = colgroup.querySelectorAll('col');
            cols.forEach((col, index) => {
                if (index < colCount) {
                    const width = Math.max(60, colMaxLengths[index] * 8 + 20);
                    col.style.width = Math.min(width, 300) + 'px';
                }
            });
        }
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
                // Обновляем локальные данные
                const currentData = this.data[this.currentSheet];
                const rowIndex = row - 1;  // Теперь строка 1 — индекс 0
                if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
                    // Если колонки не хватает, расширяем массив
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
