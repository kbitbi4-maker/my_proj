// ============================================================
// selection.js - ЛОГИКА ВЫДЕЛЕНИЯ ЯЧЕЕК (ИСПРАВЛЕННАЯ)
// Убрано ложное затемнение, добавлено позеленение заголовков
// ============================================================

class TableSelection {
    constructor(core) {
        this.core = core;
        this.selectedCell = null;
        this.selectionRange = null;
        this.isDragging = false;
        this.dragStartCell = null;
        this.isShiftPressed = false;
        this.isMouseDown = false;
    }

    // ============================================================
    // ОЧИСТКА ВЫДЕЛЕНИЯ
    // ============================================================
    clearSelection() {
        document.querySelectorAll('.cell-selected, .range-selected, .row-header.selected, .col-header.selected, .corner-header.selected')
            .forEach(el => el.classList.remove('cell-selected', 'range-selected', 'selected'));
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
        document.querySelectorAll('.cell-selected, .range-selected, .row-header.selected, .col-header.selected, .corner-header.selected')
            .forEach(el => el.classList.remove('cell-selected', 'range-selected', 'selected'));

        this.selectedCell = { row, col };
        this.selectionRange = { startRow: row, startCol: col, endRow: row, endCol: col };

        const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('cell-selected');
            
            const columnLetter = this.core.getColumnLetter(col - 1);
            document.getElementById('cellReference').textContent = `${columnLetter}${row}`;
            
            const currentData = this.core.data[this.core.currentSheet];
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
    // РАСШИРЕНИЕ ВЫДЕЛЕНИЯ (Shift)
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
    // ОБНОВЛЕНИЕ ВИЗУАЛА ВЫДЕЛЕНИЯ (БЕЗ ЛОЖНОГО ЗАТЕМНЕНИЯ)
    // ============================================================
    updateSelectionVisual() {
        // Снимаем все старые классы
        document.querySelectorAll('.cell-selected, .range-selected, .row-header.selected, .col-header.selected, .corner-header.selected')
            .forEach(el => el.classList.remove('cell-selected', 'range-selected', 'selected'));

        if (!this.selectionRange) return;

        const { startRow, startCol, endRow, endCol } = this.selectionRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        // ---- 1. ПОДСВЕТКА ЯЧЕЕК ----
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

        // ---- 2. ПОДСВЕТКА ЗАГОЛОВКОВ СТРОК (зеленые номера) ----
        // Если выделена вся строка или диапазон, захватывающий всю строку
        const currentData = this.core.data[this.core.currentSheet];
        const maxCols = currentData.rows.length > 0 ? currentData.rows[0].length : 0;
        const isFullRow = (minCol === 1 && maxCol === maxCols);
        const isFullCol = (minRow === 1 && maxRow === currentData.rows.length);
        const isFullSheet = isFullRow && isFullCol;

        // Подсветка номеров строк
        document.querySelectorAll('.row-header:not(.corner-header)').forEach(el => {
            const rowNum = parseInt(el.textContent);
            if (rowNum >= minRow && rowNum <= maxRow) {
                if (isFullRow || isFullSheet) {
                    el.classList.add('selected');
                } else if (this.selectionRange.startRow === this.selectionRange.endRow) {
                    // Если выделена одна строка
                    if (rowNum === this.selectionRange.startRow) {
                        el.classList.add('selected');
                    }
                } else {
                    // Диапазон строк
                    el.classList.add('selected');
                }
            }
        });

        // Подсветка букв колонок
        document.querySelectorAll('.col-header').forEach(el => {
            const letter = el.textContent;
            const colIndex = this.core.getColumnIndex(letter) + 1;
            if (colIndex >= minCol && colIndex <= maxCol) {
                if (isFullCol || isFullSheet) {
                    el.classList.add('selected');
                } else if (this.selectionRange.startCol === this.selectionRange.endCol) {
                    // Если выделена одна колонка
                    if (colIndex === this.selectionRange.startCol) {
                        el.classList.add('selected');
                    }
                } else {
                    // Диапазон колонок
                    el.classList.add('selected');
                }
            }
        });

        // Подсветка уголка (при выделении всего листа)
        if (isFullSheet) {
            document.querySelector('.corner-header')?.classList.add('selected');
        }

        // ---- 3. ОБНОВЛЕНИЕ ИНФОРМАЦИИ ----
        const colLetter = this.core.getColumnLetter(this.selectedCell.col - 1);
        document.getElementById('cellReference').textContent = `${colLetter}${this.selectedCell.row}`;
        const count = (maxRow - minRow + 1) * (maxCol - minCol + 1);
        document.getElementById('cellInfo').textContent = 
            `Выбрано: ${this.core.getColumnLetter(minCol - 1)}${minRow}:${this.core.getColumnLetter(maxCol - 1)}${maxRow} (${count} ячеек)`;
        
        this.updateToolbarVisibility();
    }

    // ============================================================
    // ВЫДЕЛЕНИЕ ВСЕГО ЛИСТА
    // ============================================================
    selectAll() {
        const currentData = this.core.data[this.core.currentSheet];
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
        const currentData = this.core.data[this.core.currentSheet];
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
        const currentData = this.core.data[this.core.currentSheet];
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
    // НАВИГАЦИЯ СТРЕЛКАМИ
    // ============================================================
    handleArrowKeys(e) {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        const currentData = this.core.data[this.core.currentSheet];
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
    // ОБНОВЛЕНИЕ ПАНЕЛИ ИНСТРУМЕНТОВ
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
}
