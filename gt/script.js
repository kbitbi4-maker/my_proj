// ==========================================================================
// script.js - ПОЛНАЯ ВЕРСИЯ С ВЫДЕЛЕНИЕМ КАК В GOOGLE SHEETS
// Поддержка: клик по ячейке, по заголовку строки/колонки, Shift-диапазон,
//            drag-and-drop выделение, выделение всего листа
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
        
        // Состояние выделения
        this.selectedCell = null;           // { row, col } - текущая активная ячейка
        this.selectionRange = null;         // { startRow, startCol, endRow, endCol }
        this.isDragging = false;
        this.dragStartCell = null;
        this.isShiftPressed = false;
        
        // Настройки размеров
        this.columnWidths = JSON.parse(localStorage.getItem('gt_column_widths') || '{}');
        this.rowHeights = JSON.parse(localStorage.getItem('gt_row_heights') || '{}');
        
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
        // Кнопки синхронизации
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

        // Формула-бар
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

        if (this.apiUrl) {
            document.getElementById('apiUrl').value = this.apiUrl;
        }

        // Глобальные клавиши
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('editModal').classList.remove('active');
                this.clearSelection();
            }
            if (e.key === 'Shift') {
                this.isShiftPressed = true;
            }
            if (this.selectedCell && !document.querySelector('.modal.active')) {
                this.handleArrowKeys(e);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.isShiftPressed = false;
            }
        });

        // Кнопки управления размерами
        document.getElementById('resetSizesBtn').addEventListener('click', () => {
            this.resetSizes();
        });

        document.getElementById('applyColWidthBtn').addEventListener('click', () => {
            const width = parseInt(document.getElementById('colWidthInput').value);
            if (this.selectedCell && !isNaN(width)) {
                this.setColumnWidth(this.selectedCell.col - 1, width);
            } else {
                alert('Сначала выделите ячейку в нужной колонке');
            }
        });

        document.getElementById('applyRowHeightBtn').addEventListener('click', () => {
            const height = parseInt(document.getElementById('rowHeightInput').value);
            if (this.selectedCell && !isNaN(height)) {
                this.setRowHeight(this.selectedCell.row, height);
            } else {
                alert('Сначала выделите ячейку в нужной строке');
            }
        });
    }

    // ============================================================
    // НАВИГАЦИЯ СТРЕЛКАМИ (с учётом выделения)
    // ============================================================
    handleArrowKeys(e) {
        if (!this.selectedCell) return;
        
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

        if (this.isShiftPressed) {
            // Расширяем выделение
            this.expandSelection(newRow, newCol);
        } else {
            // Перемещаем выделение на новую ячейку
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
    // ОЧИСТКА ВЫДЕЛЕНИЯ
    // ============================================================
    clearSelection() {
        document.querySelectorAll('.cell-selected, .row-selected, .col-selected, .range-selected')
            .forEach(el => el.classList.remove('cell-selected', 'row-selected', 'col-selected', 'range-selected'));
        this.selectionRange = null;
        this.selectedCell = null;
        document.getElementById('cellInfo').textContent = 'Выбрано: —';
        document.getElementById('cellReference').textContent = 'A1';
        document.getElementById('formulaInput').value = '';
    }

    // ============================================================
    // ВЫДЕЛЕНИЕ ЯЧЕЙКИ (одиночный клик)
    // ============================================================
    selectCell(row, col) {
        // Снимаем предыдущее выделение
        document.querySelectorAll('.cell-selected, .row-selected, .col-selected, .range-selected')
            .forEach(el => el.classList.remove('cell-selected', 'row-selected', 'col-selected', 'range-selected'));

        this.selectedCell = { row, col };
        this.selectionRange = { startRow: row, startCol: col, endRow: row, endCol: col };

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
    // РАСШИРЕНИЕ ВЫДЕЛЕНИЯ (Shift + клик / стрелки)
    // ============================================================
    expandSelection(row, col) {
        if (!this.selectionRange) {
            this.selectionRange = { startRow: row, startCol: col, endRow: row, endCol: col };
        }

        this.selectionRange.endRow = row;
        this.selectionRange.endCol = col;
        this.selectedCell = { row, col };

        this.updateSelectionVisual();
    }

    // ============================================================
    // ОБНОВЛЕНИЕ ВИЗУАЛА ВЫДЕЛЕНИЯ (для диапазона)
    // ============================================================
    updateSelectionVisual() {
        // Снимаем старые классы
        document.querySelectorAll('.cell-selected, .row-selected, .col-selected, .range-selected')
            .forEach(el => el.classList.remove('cell-selected', 'row-selected', 'col-selected', 'range-selected'));

        if (!this.selectionRange) return;

        const { startRow, startCol, endRow, endCol } = this.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        // Подсвечиваем все ячейки в диапазоне
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const cell = document.querySelector(`td[data-row="${r}"][data-col="${c}"]`);
                if (cell) {
                    if (r === this.selectedCell.row && c === this.selectedCell.col) {
                        cell.classList.add('cell-selected');
                    } else {
                        cell.classList.add('range-selected');
                    }
                }
            }
        }

        // Подсвечиваем строки и колонки
        for (let r = minRow; r <= maxRow; r++) {
            document.querySelectorAll(`td[data-row="${r}"]`).forEach(td => {
                if (!td.classList.contains('cell-selected') && !td.classList.contains('range-selected')) {
                    td.classList.add('row-selected');
                }
            });
        }

        for (let c = minCol; c <= maxCol; c++) {
            document.querySelectorAll(`td[data-col="${c}"]`).forEach(td => {
                if (!td.classList.contains('cell-selected') && !td.classList.contains('range-selected')) {
                    td.classList.add('col-selected');
                }
            });
        }

        // Обновляем информацию
        const colLetter = this.getColumnLetter(this.selectedCell.col - 1);
        document.getElementById('cellReference').textContent = `${colLetter}${this.selectedCell.row}`;
        document.getElementById('cellInfo').textContent = 
            `Выбрано: ${this.getColumnLetter(minCol - 1)}${minRow}:${this.getColumnLetter(maxCol - 1)}${maxRow} (${(maxRow - minRow + 1) * (maxCol - minCol + 1)} ячеек)`;
    }

    // ============================================================
    // ВЫДЕЛЕНИЕ ВСЕГО ЛИСТА (клик на уголок между заголовками)
    // ============================================================
    selectAll() {
        const currentData = this.data[this.currentSheet];
        const maxRow = currentData.rows.length;
        const maxCol = currentData.rows.length > 0 ? currentData.rows[0].length : 0;

        if (maxRow === 0 || maxCol === 0) return;

        this.selectionRange = {
            startRow: 1,
            startCol: 1,
            endRow: maxRow,
            endCol: maxCol
        };
        this.selectedCell = { row: 1, col: 1 };
        this.updateSelectionVisual();
    }

    // ============================================================
    // ВЫДЕЛЕНИЕ СТРОКИ (клик на номер строки)
    // ============================================================
    selectRow(row) {
        const currentData = this.data[this.currentSheet];
        const maxCol = currentData.rows.length > 0 ? currentData.rows[0].length : 0;

        if (maxCol === 0) return;

        this.selectionRange = {
            startRow: row,
            startCol: 1,
            endRow: row,
            endCol: maxCol
        };
        this.selectedCell = { row, col: 1 };
        this.updateSelectionVisual();
    }

    // ============================================================
    // ВЫДЕЛЕНИЕ КОЛОНКИ (клик на букву колонки)
    // ============================================================
    selectColumn(col) {
        const currentData = this.data[this.currentSheet];
        const maxRow = currentData.rows.length;

        if (maxRow === 0) return;

        this.selectionRange = {
            startRow: 1,
            startCol: col,
            endRow: maxRow,
            endCol: col
        };
        this.selectedCell = { row: 1, col: col };
        this.updateSelectionVisual();
    }

    // ============================================================
    // НАЧАЛО DRAG-ВЫДЕЛЕНИЯ
    // ============================================================
    startDrag(row, col) {
        this.isDragging = true;
        this.dragStartCell = { row, col };
        this.selectCell(row, col);
    }

    // ============================================================
    // ПРОДОЛЖЕНИЕ DRAG-ВЫДЕЛЕНИЯ
    // ============================================================
    continueDrag(row, col) {
        if (!this.isDragging || !this.dragStartCell) return;
        this.expandSelection(row, col);
    }

    // ============================================================
    // ЗАВЕРШЕНИЕ DRAG-ВЫДЕЛЕНИЯ
    // ============================================================
    endDrag() {
        this.isDragging = false;
        this.dragStartCell = null;
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
        this.clearSelection();
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
    // ОТРИСОВКА ТАБЛИЦЫ (с кликабельными заголовками)
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

        // ---- ВЫЧИСЛЯЕМ ШИРИНУ КОЛОНОК ----
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

        const sheetKey = `${this.currentSheet}`;
        if (!this.columnWidths[sheetKey]) {
            this.columnWidths[sheetKey] = {};
            colWidths.forEach((width, index) => {
                this.columnWidths[sheetKey][index] = width;
            });
        }

        // ---- ЗАГОЛОВКИ КОЛОНОК (буквы, кликабельные) ----
        let headerHtml = '<tr>';
        // Уголок (клик для выделения всего)
        headerHtml += `<th class="row-header corner-header" onclick="tableManager.selectAll()" title="Выделить всё">`;
        headerHtml += `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">`;
        headerHtml += `<i class="fas fa-caret-down" style="font-size:10px;color:#5f6368;"></i>`;
        headerHtml += `</div></th>`;
        
        for (let i = 0; i < maxCols; i++) {
            const letter = this.getColumnLetter(i);
            const width = colWidths[i] || 100;
            headerHtml += `<th class="col-header" onclick="tableManager.selectColumn(${i + 1})" 
                           style="min-width:${width}px; max-width:${width}px; cursor:pointer;">
                           ${letter}</th>`;
        }
        headerHtml += '</tr>';
        thead.innerHTML = headerHtml;

        // ---- ТЕЛО ТАБЛИЦЫ ----
        if (rows.length > 0) {
            let bodyHtml = '';
            rows.forEach((row, rowIndex) => {
                const actualRow = rowIndex + 1;
                
                let rowHeight = '';
                if (this.rowHeights[sheetKey] && this.rowHeights[sheetKey][actualRow]) {
                    rowHeight = `height: ${this.rowHeights[sheetKey][actualRow]}px;`;
                }
                
                bodyHtml += `<tr style="${rowHeight}">`;
                // Номер строки (кликабельный)
                bodyHtml += `<td class="row-header" onclick="tableManager.selectRow(${actualRow})" 
                              style="cursor:pointer;">${actualRow}</td>`;
                
                for (let colIndex = 0; colIndex < maxCols; colIndex++) {
                    const actualCol = colIndex + 1;
                    const value = row && row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '';
                    const width = colWidths[colIndex] || 100;
                    
                    bodyHtml += `<td data-row="${actualRow}" data-col="${actualCol}" 
                                   class="data-cell"
                                   style="min-width:${width}px; max-width:${width}px; 
                                          word-wrap: break-word; white-space: normal; padding: 6px 8px;
                                          cursor: cell;"
                                   onmousedown="tableManager.handleCellMouseDown(event, ${actualRow}, ${actualCol})"
                                   onmouseover="tableManager.handleCellMouseOver(event, ${actualRow}, ${actualCol})"
                                   onmouseup="tableManager.handleCellMouseUp(event)"
                                   ondblclick="tableManager.editCell(${actualRow}, ${actualCol})">
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

        // Восстанавливаем выделение, если оно было
        if (this.selectionRange) {
            this.updateSelectionVisual();
        }

        const sheetLabels = { sheet1: 'Лист 1', sheet2: 'Лист 2', sheet3: 'Лист 3', sheet4: 'Лист 4' };
        document.getElementById('sheetNameDisplay').textContent = sheetLabels[this.currentSheet] || this.currentSheet;
    }

    // ============================================================
    // ОБРАБОТЧИКИ МЫШИ ДЛЯ DRAG-ВЫДЕЛЕНИЯ
    // ============================================================
    handleCellMouseDown(event, row, col) {
        if (event.button !== 0) return; // только левая кнопка
        
        const isShift = event.shiftKey;
        
        if (isShift && this.selectedCell) {
            // Shift + клик — расширение диапазона
            this.expandSelection(row, col);
        } else {
            // Начинаем перетаскивание
            this.startDrag(row, col);
        }
    }

    handleCellMouseOver(event, row, col) {
        if (this.isDragging) {
            this.continueDrag(row, col);
        }
    }

    handleCellMouseUp(event) {
        if (this.isDragging) {
            this.endDrag();
        }
    }

    // ============================================================
    // ВСПОМОГАТЕЛЬНАЯ: РАСЧЕТ ШИРИНЫ СТРОКИ
    // ============================================================
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

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
let tableManager;
document.addEventListener('DOMContentLoaded', () => {
    tableManager = new TableManager();
});
