// ==========================================================================
// script.js - ПОЛНОСТЬЮ ОБНОВЛЕН ДЛЯ ЭТАПА 1
// ПОДДЕРЖКА: нумерация строк, буквы колонок, выделение ячеек, формула-бар
// ==========================================================================

class TableManager {
    constructor() {
        this.apiUrl = localStorage.getItem('gt_api_url') || '';
        this.data = { 
            sheet1: { headers: [], rows: [] },
            sheet2: { headers: [], rows: [] },
            sheet3: { headers: [], rows: [] },
            sheet4: { headers: [], rows: [] }
        };
        this.currentSheet = 'sheet1';
        this.selectedCell = null; // { row, col }
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
        // Синхронизация
        document.getElementById('syncBtn').addEventListener('click', () => this.syncData());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadData());

        // Навигация по табам
        document.querySelectorAll('.main-nav li').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.main-nav li').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const page = item.dataset.page;
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(`page-${page}`).classList.add('active');
            });
        });

        // Формула-бар: подтверждение (Enter)
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

        // Формула-бар: кнопки
        document.getElementById('formulaConfirm').addEventListener('click', () => this.applyFormula());
        document.getElementById('formulaCancel').addEventListener('click', () => this.cancelFormula());

        // Переключение листов
        document.querySelectorAll('.sheet-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.switchSheet(tab.dataset.sheet);
            });
        });

        // Модалка
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('editModal').classList.remove('active');
        });
        document.getElementById('cancelCellBtn').addEventListener('click', () => {
            document.getElementById('editModal').classList.remove('active');
        });
        document.getElementById('saveCellBtn').addEventListener('click', () => {
            this.saveCellValue();
        });

        // Настройки
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

        // Загружаем URL в поле настроек
        if (this.apiUrl) {
            document.getElementById('apiUrl').value = this.apiUrl;
        }

        // Глобальные клавиши
        document.addEventListener('keydown', (e) => {
            // Escape для модалки
            if (e.key === 'Escape') {
                document.getElementById('editModal').classList.remove('active');
            }
            // Стрелки для навигации
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
        const maxRow = currentData.rows.length + 1; // +1 для заголовка
        const maxCol = currentData.headers.length;

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
    // ПОЛУЧЕНИЕ БУКВЫ КОЛОНКИ (A, B, C, ... AA, AB, ...)
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
        let index = 0;
        for (let i = 0; i < letter.length; i++) {
            index = index * 26 + (letter.charCodeAt(i) - 64);
        }
        return index - 1;
    }

    // ============================================================
    // ВЫДЕЛЕНИЕ ЯЧЕЙКИ
    // ============================================================
    selectCell(row, col) {
        // Снимаем предыдущее выделение
        document.querySelectorAll('.cell-selected, .row-selected, .col-selected')
            .forEach(el => el.classList.remove('cell-selected', 'row-selected', 'col-selected'));

        this.selectedCell = { row, col };

        // Подсвечиваем ячейку
        const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('cell-selected');
            
            // Подсвечиваем строку
            const rowElement = cell.closest('tr');
            if (rowElement) {
                rowElement.querySelectorAll('td').forEach(td => {
                    if (!td.classList.contains('cell-selected')) {
                        td.classList.add('row-selected');
                    }
                });
            }
            
            // Подсвечиваем колонку
            document.querySelectorAll(`td[data-col="${col}"]`).forEach(td => {
                if (!td.classList.contains('cell-selected')) {
                    td.classList.add('col-selected');
                }
            });
            
            // Обновляем строку формул
            const columnLetter = this.getColumnLetter(col - 1);
            document.getElementById('cellReference').textContent = `${columnLetter}${row}`;
            
            // Показываем значение в строке формул
            const currentData = this.data[this.currentSheet];
            const rowIndex = row - 2; // потому что строка 1 — заголовки
            let value = '';
            if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
                value = currentData.rows[rowIndex]?.[col - 1] || '';
            }
            document.getElementById('formulaInput').value = value;
            
            // Обновляем статус-бар
            document.getElementById('cellInfo').textContent = `Выбрано: ${columnLetter}${row}`;
        }
    }

    // ============================================================
    // ПРИМЕНЕНИЕ ФОРМУЛЫ (СОХРАНЕНИЕ ИЗ ФОРМУЛА-БАР)
    // ============================================================
    async applyFormula() {
        if (!this.selectedCell) return;

        const value = document.getElementById('formulaInput').value.trim();
        const { row, col } = this.selectedCell;

        // Сохраняем как обычное значение (пока без формул)
        this.editingCell = { row, col };
        document.getElementById('cellInput').value = value;
        await this.saveCellValue();
    }

    cancelFormula() {
        if (this.selectedCell) {
            const { row, col } = this.selectedCell;
            const currentData = this.data[this.currentSheet];
            const rowIndex = row - 2;
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
                        this.data[key] = {
                            headers: result[key][0] || [],
                            rows: result[key].slice(1) || []
                        };
                    } else {
                        this.data[key] = { headers: [], rows: [] };
                    }
                });

                this.renderTable();
                this.updateStats();
                this.updateOverview();
                this.showSyncStatus(true);
                loading.style.display = 'none';

                // Выбираем первую ячейку
                if (this.data[this.currentSheet].rows.length > 0) {
                    this.selectCell(2, 1);
                } else {
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
        // Выбираем первую ячейку
        const currentData = this.data[this.currentSheet];
        if (currentData.rows.length > 0) {
            this.selectCell(2, 1);
        } else if (currentData.headers.length > 0) {
            this.selectCell(1, 1);
        }
        // Обновляем имя в шапке
        const sheetLabels = { sheet1: 'Лист 1', sheet2: 'Лист 2', sheet3: 'Лист 3', sheet4: 'Лист 4' };
        document.getElementById('sheetNameDisplay').textContent = sheetLabels[sheetName] || sheetName;
    }

    // ============================================================
    // ОТРИСОВКА ТАБЛИЦЫ (С НУМЕРАЦИЕЙ)
    // ============================================================
    renderTable() {
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        const currentData = this.data[this.currentSheet] || { headers: [], rows: [] };
        const headers = currentData.headers || [];
        const rows = currentData.rows || [];

        // ---- ЗАГОЛОВКИ КОЛОНОК (буквы) ----
        let headerHtml = '<tr><th class="row-header"></th>';
        headers.forEach((h, index) => {
            const letter = this.getColumnLetter(index);
            headerHtml += `<th>${letter}</th>`;
        });
        headerHtml += '</tr>';
        thead.innerHTML = headerHtml;

        // ---- ТЕЛО ТАБЛИЦЫ (строки с номерами) ----
        if (rows.length > 0) {
            let bodyHtml = '';
            rows.forEach((row, rowIndex) => {
                const actualRow = rowIndex + 2; // строка 1 — заголовки
                bodyHtml += `<tr>`;
                bodyHtml += `<td class="row-header">${actualRow}</td>`;
                row.forEach((cell, colIndex) => {
                    const actualCol = colIndex + 1;
                    const value = cell !== undefined && cell !== null ? cell : '';
                    bodyHtml += `<td data-row="${actualRow}" data-col="${actualCol}" 
                                   onclick="tableManager.selectCell(${actualRow}, ${actualCol})"
                                   ondblclick="tableManager.editCell(${actualRow}, ${actualCol})">
                                   ${value}</td>`;
                });
                bodyHtml += '</tr>';
            });
            tbody.innerHTML = bodyHtml;
        } else {
            tbody.innerHTML = `<tr>
                <td class="row-header">1</td>
                <td colspan="${Math.max(headers.length, 1)}" style="text-align:center; padding:20px; color:#999;">
                    Нет данных для отображения
                </td>
            </tr>`;
        }

        // Обновляем имя листа
        const sheetLabels = { sheet1: 'Лист 1', sheet2: 'Лист 2', sheet3: 'Лист 3', sheet4: 'Лист 4' };
        document.getElementById('sheetNameDisplay').textContent = sheetLabels[this.currentSheet] || this.currentSheet;
    }

    // ============================================================
    // РЕДАКТИРОВАНИЕ ЯЧЕЙКИ (через модалку)
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
    // СОХРАНЕНИЕ ЯЧЕЙКИ (POST как text/plain)
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
                const rowIndex = row - 2;
                if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
                    currentData.rows[rowIndex][col - 1] = value;
                }
                
                this.renderTable();
                document.getElementById('editModal').classList.remove('active');
                // Обновляем строку формул
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
        const currentData = this.data[this.currentSheet] || { headers: [], rows: [] };
        document.getElementById('rowCount').textContent = `Строк: ${currentData.rows.length}`;
        document.getElementById('colCount').textContent = `Колонок: ${currentData.headers.length}`;
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

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
let tableManager;
document.addEventListener('DOMContentLoaded', () => {
    tableManager = new TableManager();
});
