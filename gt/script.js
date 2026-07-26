// ==========================================================================
// script.js - ПОЛНАЯ ВЕРСИЯ С ИСПРАВЛЕННЫМИ ГОРЯЧИМИ КЛАВИШАМИ
// Поддержка: выделение, копирование (Ctrl+C), вставка (Ctrl+V),
//            очистка (Delete), массовое редактирование
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
        this.selectedCell = null;
        this.selectionRange = null;
        this.isDragging = false;
        this.dragStartCell = null;
        this.isShiftPressed = false;
        
        // Буфер обмена (для копирования)
        this.clipboardData = null;
        
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
    // ПРИВЯЗКА СОБЫТИЙ (ПОЛНОСТЬЮ ИСПРАВЛЕНА)
    // ============================================================
    bindEvents() {
        // ============================================================
        // ГЛОБАЛЬНЫЕ ГОРЯЧИЕ КЛАВИШИ (С ПРИОРИТЕТОМ)
        // ============================================================
        document.addEventListener('keydown', (e) => {
            // Ctrl+C — копирование
            if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    return;
                }
                e.preventDefault();
                this.copySelection();
                console.log('🔄 Ctrl+C перехвачен для копирования ячеек');
                return;
            }

            // Ctrl+V — вставка
            if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    return;
                }
                e.preventDefault();
                this.pasteSelection();
                console.log('🔄 Ctrl+V перехвачен для вставки ячеек');
                return;
            }

            // Delete / Backspace — очистка
            if ((e.key === 'Delete' || e.key === 'Backspace') && !document.querySelector('.modal.active')) {
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    return;
                }
                e.preventDefault();
                if (this.selectionRange) {
                    this.clearSelectedCells();
                    console.log('🔄 Delete перехвачен для очистки ячеек');
                }
                return;
            }

            // Escape — снять выделение
            if (e.key === 'Escape') {
                document.getElementById('editModal').classList.remove('active');
                this.clearSelection();
                return;
            }

            // Shift
            if (e.key === 'Shift') {
                this.isShiftPressed = true;
            }

            // Стрелки
            if (this.selectedCell && !document.querySelector('.modal.active')) {
                this.handleArrowKeys(e);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.isShiftPressed = false;
            }
        });

        // ============================================================
        // КНОПКИ СИНХРОНИЗАЦИИ
        // ============================================================
        document.getElementById('syncBtn').addEventListener('click', () => this.syncData());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadData());

        // ============================================================
        // НАВИГАЦИЯ ПО ТАБАМ
        // ============================================================
        document.querySelectorAll('.main-nav li').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.main-nav li').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const page = item.dataset.page;
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(`page-${page}`).classList.add('active');
            });
        });

        // ============================================================
        // ФОРМУЛА-БАР
        // ============================================================
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

        // ============================================================
        // ПЕРЕКЛЮЧАТЕЛЬ ЛИСТОВ
        // ============================================================
        document.querySelectorAll('.sheet-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.switchSheet(tab.dataset.sheet);
            });
        });

        // ============================================================
        // МОДАЛКА РЕДАКТИРОВАНИЯ
        // ============================================================
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('editModal').classList.remove('active');
        });
        document.getElementById('cancelCellBtn').addEventListener('click', () => {
            document.getElementById('editModal').classList.remove('active');
        });
        document.getElementById('saveCellBtn').addEventListener('click', () => {
            this.saveCellValue();
        });

        // ============================================================
        // НАСТРОЙКИ
        // ============================================================
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

        // ============================================================
        // УПРАВЛЕНИЕ РАЗМЕРАМИ
        // ============================================================
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

        // ============================================================
        // ПАНЕЛЬ ИНСТРУМЕНТОВ
        // ============================================================
        document.getElementById('toolbarCopyBtn').addEventListener('click', () => this.copySelection());
        document.getElementById('toolbarPasteBtn').addEventListener('click', () => this.pasteSelection());
        document.getElementById('toolbarClearBtn').addEventListener('click', () => {
            if (this.selectionRange) {
                this.clearSelectedCells();
            }
        });
        document.getElementById('toolbarReplaceBtn').addEventListener('click', () => {
            const find = document.getElementById('toolbarReplaceFind').value;
            const replace = document.getElementById('toolbarReplaceWith').value;
            if (find) {
                this.replaceInSelection(find, replace);
            } else {
                this.showToast('⚠️ Введите текст для поиска');
            }
        });
        document.getElementById('toolbarFillBtn').addEventListener('click', () => {
            const value = document.getElementById('toolbarFillValue').value;
            if (value !== undefined && value !== null) {
                this.fillSelection(value);
            } else {
                this.showToast('⚠️ Введите значение для заполнения');
            }
        });

        // ============================================================
        // ОБРАБОТЧИКИ МЫШИ ДЛЯ DRAG-ВЫДЕЛЕНИЯ
        // ============================================================
        document.getElementById('dataTable').addEventListener('mousedown', (e) => {
            const cell = e.target.closest('.data-cell');
            if (!cell) return;
            if (e.button !== 0) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (e.shiftKey && this.selectedCell) {
                this.expandSelection(row, col);
            } else {
                this.startDrag(row, col);
            }
        });

        document.getElementById('dataTable').addEventListener('mouseover', (e) => {
            const cell = e.target.closest('.data-cell');
            if (!cell) return;
            if (this.isDragging) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.continueDrag(row, col);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.endDrag();
            }
        });

        // Обновляем панель инструментов при выделении
        this.updateToolbarVisibility();
    }

    // ============================================================
    // ОБНОВЛЕНИЕ ВИДИМОСТИ ПАНЕЛИ ИНСТРУМЕНТОВ
    // ============================================================
    updateToolbarVisibility() {
        const toolbar = document.getElementById('selectionToolbar');
        if (!toolbar) return;
        
        const hasSelection = this.selectionRange !== null;
        toolbar.classList.toggle('visible', hasSelection);
        
        if (hasSelection && this.selectionRange) {
            const { startRow, startCol, endRow, endCol } = this.selectionRange;
            const minRow = Math.min(startRow, endRow);
            const maxRow = Math.max(startRow, endRow);
            const minCol = Math.min(startCol, endCol);
            const maxCol = Math.max(startCol, endCol);
            const count = (maxRow - minRow + 1) * (maxCol - minCol + 1);
            document.getElementById('selectionCount').textContent = count;
        }
    }

    // ============================================================
    // НАВИГАЦИЯ СТРЕЛКАМИ
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
            this.expandSelection(newRow, newCol);
        } else {
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
        this.updateToolbarVisibility();
    }

    // ============================================================
    // ВЫДЕЛЕНИЕ ЯЧЕЙКИ
    // ============================================================
    selectCell(row, col) {
        document.querySelectorAll('.cell-selected, .row-selected, .col-selected, .range-selected')
            .forEach(el => el.classList.remove('cell-selected', 'row-selected', 'col-selected', 'range-selected'));

        this.selectedCell = { row, col };
        this.selectionRange = { startRow: row, startCol: col, endRow: row, endCol: col };

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
        this.updateToolbarVisibility();
    }

    // ============================================================
    // РАСШИРЕНИЕ ВЫДЕЛЕНИЯ
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
    // ОБНОВЛЕНИЕ ВИЗУАЛА ВЫДЕЛЕНИЯ
    // ============================================================
    updateSelectionVisual() {
        document.querySelectorAll('.cell-selected, .row-selected, .col-selected, .range-selected')
            .forEach(el => el.classList.remove('cell-selected', 'row-selected', 'col-selected', 'range-selected'));

        if (!this.selectionRange) return;

        const { startRow, startCol, endRow, endCol } = this.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

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

        const colLetter = this.getColumnLetter(this.selectedCell.col - 1);
        document.getElementById('cellReference').textContent = `${colLetter}${this.selectedCell.row}`;
        const count = (maxRow - minRow + 1) * (maxCol - minCol + 1);
        document.getElementById('cellInfo').textContent = 
            `Выбрано: ${this.getColumnLetter(minCol - 1)}${minRow}:${this.getColumnLetter(maxCol - 1)}${maxRow} (${count} ячеек)`;
        
        this.updateToolbarVisibility();
    }

    // ============================================================
    // ВЫДЕЛЕНИЕ ВСЕГО ЛИСТА
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
    // ВЫДЕЛЕНИЕ СТРОКИ
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
    // ВЫДЕЛЕНИЕ КОЛОНКИ
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
    // DRAG-ВЫДЕЛЕНИЕ
    // ============================================================
    startDrag(row, col) {
        this.isDragging = true;
        this.dragStartCell = { row, col };
        this.selectCell(row, col);
    }

    continueDrag(row, col) {
        if (!this.isDragging || !this.dragStartCell) return;
        this.expandSelection(row, col);
    }

    endDrag() {
        this.isDragging = false;
        this.dragStartCell = null;
    }

    // ============================================================
    // КОПИРОВАНИЕ (Ctrl+C) - ИСПРАВЛЕННАЯ ВЕРСИЯ
    // ============================================================
    copySelection() {
        if (!this.selectionRange) {
            this.showToast('⚠️ Нет выделенных ячеек для копирования');
            console.log('❌ Нет выделенных ячеек');
            return;
        }

        console.log('📋 Начинаем копирование...');
        console.log('📋 selectionRange:', this.selectionRange);

        const { startRow, startCol, endRow, endCol } = this.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        console.log(`📋 Диапазон: строки ${minRow}-${maxRow}, колонки ${minCol}-${maxCol}`);

        const currentData = this.data[this.currentSheet];
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

        // Сохраняем в буфер обмена приложения
        this.clipboardData = {
            data: copiedData,
            rows: copiedData.length,
            cols: copiedData[0]?.length || 0
        };

        // Копируем в системный буфер обмена
        const textRepresentation = copiedData.map(row => row.join('\t')).join('\n');
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textRepresentation)
                .then(() => {
                    console.log('✅ Скопировано в системный буфер обмена');
                    console.log('📋 Данные:\n', textRepresentation.substring(0, 200) + '...');
                })
                .catch(err => {
                    console.warn('⚠️ Не удалось скопировать в системный буфер:', err);
                    this.fallbackCopy(textRepresentation);
                });
        } else {
            this.fallbackCopy(textRepresentation);
        }

        const rows = copiedData.length;
        const cols = copiedData[0]?.length || 0;
        this.showToast(`✅ Скопировано: ${rows} × ${cols} ячеек (${cellCount} непустых)`);
        console.log(`📋 Скопировано: ${rows} × ${cols} ячеек`);
        console.log('📋 clipboardData:', this.clipboardData);
    }

    // ============================================================
    // FALLBACK ДЛЯ КОПИРОВАНИЯ
    // ============================================================
    fallbackCopy(text) {
        console.log('📋 Используем fallback копирование...');
        
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
            const success = document.execCommand('copy');
            if (success) {
                console.log('✅ Fallback: скопировано через execCommand');
            } else {
                console.warn('⚠️ Fallback: execCommand не сработал');
            }
        } catch (err) {
            console.error('❌ Fallback ошибка:', err);
        }
        
        document.body.removeChild(textarea);
    }

    // ============================================================
    // ВСТАВКА (Ctrl+V) - ИСПРАВЛЕННАЯ ВЕРСИЯ
    // ============================================================
    async pasteSelection() {
        if (!this.clipboardData) {
            this.showToast('⚠️ Буфер обмена пуст. Сначала скопируйте ячейки (Ctrl+C)');
            return;
        }

        if (!this.selectedCell) {
            this.showToast('⚠️ Выберите целевую ячейку для вставки');
            return;
        }

        console.log('📋 Вставка данных:', this.clipboardData);

        const targetRow = this.selectedCell.row;
        const targetCol = this.selectedCell.col;
        const { data, rows, cols } = this.clipboardData;

        const sheetNumber = this.currentSheet.replace('sheet', '');
        const currentData = this.data[this.currentSheet];
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
                await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(jsonData)
                });
            }
            this.renderTable();
            this.showToast(`✅ Вставлено: ${rows} × ${cols} ячеек`);
            console.log(`✅ Вставлено: ${rows} × ${cols} ячеек`);
        } catch (error) {
            console.error('❌ Ошибка вставки:', error);
            this.showToast('❌ Ошибка при вставке данных');
        }
    }

    // ============================================================
    // ОЧИСТКА ВЫДЕЛЕННЫХ ЯЧЕЕК (Delete)
    // ============================================================
    async clearSelectedCells() {
        if (!this.selectionRange) {
            this.showToast('⚠️ Нет выделенных ячеек для очистки');
            return;
        }

        const { startRow, startCol, endRow, endCol } = this.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        const sheetNumber = this.currentSheet.replace('sheet', '');
        const currentData = this.data[this.currentSheet];
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
                await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(jsonData)
                });
            }
            this.renderTable();
            this.showToast(`✅ Очищено: ${updates.length} ячеек`);
        } catch (error) {
            console.error('❌ Ошибка очистки:', error);
            this.showToast('❌ Ошибка при очистке ячеек');
        }
    }

    // ============================================================
    // ЗАМЕНА В ВЫДЕЛЕННЫХ ЯЧЕЙКАХ
    // ============================================================
    async replaceInSelection(findText, replaceText) {
        if (!this.selectionRange) {
            this.showToast('⚠️ Нет выделенных ячеек');
            return;
        }

        if (!findText || findText === '') {
            this.showToast('⚠️ Введите текст для поиска');
            return;
        }

        const { startRow, startCol, endRow, endCol } = this.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        const sheetNumber = this.currentSheet.replace('sheet', '');
        const currentData = this.data[this.currentSheet];
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
            this.showToast('⚠️ Текст "' + findText + '" не найден в выделенных ячейках');
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
                await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(jsonData)
                });
            }
            this.renderTable();
            this.showToast(`✅ Заменено в ${replacedCount} ячейках`);
        } catch (error) {
            console.error('❌ Ошибка замены:', error);
            this.showToast('❌ Ошибка при замене значений');
        }
    }

    // ============================================================
    // МАССОВОЕ ЗАПОЛНЕНИЕ ВЫДЕЛЕННЫХ ЯЧЕЕК
    // ============================================================
    async fillSelection(value) {
        if (!this.selectionRange) {
            this.showToast('⚠️ Нет выделенных ячеек');
            return;
        }

        if (value === undefined || value === null) {
            this.showToast('⚠️ Введите значение для заполнения');
            return;
        }

        const { startRow, startCol, endRow, endCol } = this.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        const sheetNumber = this.currentSheet.replace('sheet', '');
        const currentData = this.data[this.currentSheet];
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
                await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(jsonData)
                });
            }
            this.renderTable();
            this.showToast(`✅ Заполнено ${updates.length} ячеек значением "${value}"`);
        } catch (error) {
            console.error('❌ Ошибка заполнения:', error);
            this.showToast('❌ Ошибка при заполнении ячеек');
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
    // ОТРИСОВКА ТАБЛИЦЫ
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

        let headerHtml = '<tr>';
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

        if (rows.length > 0) {
            let bodyHtml = '';
            rows.forEach((row, rowIndex) => {
                const actualRow = rowIndex + 1;
                
                let rowHeight = '';
                if (this.rowHeights[sheetKey] && this.rowHeights[sheetKey][actualRow]) {
                    rowHeight = `height: ${this.rowHeights[sheetKey][actualRow]}px;`;
                }
                
                bodyHtml += `<tr style="${rowHeight}">`;
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
                                          cursor: cell;">${value}</td>`;
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

        if (this.selectionRange) {
            this.updateSelectionVisual();
        }

        const sheetLabels = { sheet1: 'Лист 1', sheet2: 'Лист 2', sheet3: 'Лист 3', sheet4: 'Лист 4' };
        document.getElementById('sheetNameDisplay').textContent = sheetLabels[this.currentSheet] || this.currentSheet;
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
