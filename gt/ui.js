// ============================================================
// ui.js - UI-СОБЫТИЯ И ГОРЯЧИЕ КЛАВИШИ (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ)
// Все события привязаны через addEventListener — НЕТ onclick в HTML
// ============================================================

class TableUI {
    constructor(core, selection, clipboard) {
        this.core = core;
        this.selection = selection;
        this.clipboard = clipboard;
        this.bindEvents();
    }

    bindEvents() {
        // ============================================================
        // ГОРЯЧИЕ КЛАВИШИ (Ctrl+C, Ctrl+V, Delete, Escape, Стрелки)
        // ============================================================
        window.addEventListener('keydown', (e) => {
            const isCtrlC = e.ctrlKey && (e.code === 'KeyC');
            const isCtrlV = e.ctrlKey && (e.code === 'KeyV');
            
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'SELECT'
            );
            
            if (isInputFocused) return;
            
            if (isCtrlC) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Ctrl+C перехвачен для копирования ячеек');
                this.clipboard.copySelection();
                return;
            }
            
            if (isCtrlV) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Ctrl+V перехвачен для вставки ячеек');
                this.clipboard.pasteSelection();
                return;
            }
            
            if ((e.key === 'Delete' || e.key === 'Backspace') && !document.querySelector('.modal.active')) {
                if (!isInputFocused) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.selection.selectionRange) {
                        this.clipboard.clearSelectedCells();
                        console.log('🔄 Delete перехвачен для очистки ячеек');
                    }
                }
                return;
            }

            if (e.key === 'Escape') {
                document.getElementById('editModal').classList.remove('active');
                this.selection.clearSelection();
                return;
            }

            if (e.key === 'Shift') {
                this.selection.isShiftPressed = true;
            }

            if (this.selection.selectedCell && !document.querySelector('.modal.active')) {
                this.selection.handleArrowKeys(e);
            }
        }, true);

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.selection.isShiftPressed = false;
            }
        });

        // ============================================================
        // КНОПКИ СИНХРОНИЗАЦИИ
        // ============================================================
        document.getElementById('syncBtn').addEventListener('click', () => this.core.syncData());
        document.getElementById('refreshBtn').addEventListener('click', () => this.core.loadData());

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
                this.core.switchSheet(tab.dataset.sheet);
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
                this.core.apiUrl = url;
                localStorage.setItem('gt_api_url', url);
                alert('✅ Настройки сохранены!');
                this.core.loadData();
            } else {
                alert('❌ Введите корректный URL');
            }
        });

        if (this.core.apiUrl) {
            document.getElementById('apiUrl').value = this.core.apiUrl;
        }

        // ============================================================
        // УПРАВЛЕНИЕ РАЗМЕРАМИ
        // ============================================================
        document.getElementById('resetSizesBtn').addEventListener('click', () => {
            this.core.resetSizes();
        });

        document.getElementById('applyColWidthBtn').addEventListener('click', () => {
            const width = parseInt(document.getElementById('colWidthInput').value);
            if (this.selection.selectedCell && !isNaN(width)) {
                this.core.setColumnWidth(this.selection.selectedCell.col - 1, width);
            } else {
                alert('Сначала выделите ячейку в нужной колонке');
            }
        });

        document.getElementById('applyRowHeightBtn').addEventListener('click', () => {
            const height = parseInt(document.getElementById('rowHeightInput').value);
            if (this.selection.selectedCell && !isNaN(height)) {
                this.core.setRowHeight(this.selection.selectedCell.row, height);
            } else {
                alert('Сначала выделите ячейку в нужной строке');
            }
        });

        // ============================================================
        // ПАНЕЛЬ ИНСТРУМЕНТОВ
        // ============================================================
        document.getElementById('toolbarCopyBtn').addEventListener('click', () => this.clipboard.copySelection());
        document.getElementById('toolbarPasteBtn').addEventListener('click', () => this.clipboard.pasteSelection());
        document.getElementById('toolbarClearBtn').addEventListener('click', () => {
            if (this.selection.selectionRange) {
                this.clipboard.clearSelectedCells();
            }
        });
        document.getElementById('toolbarReplaceBtn').addEventListener('click', () => {
            const find = document.getElementById('toolbarReplaceFind').value;
            const replace = document.getElementById('toolbarReplaceWith').value;
            if (find) {
                this.clipboard.replaceInSelection(find, replace);
            } else {
                this.core.showToast('⚠️ Введите текст для поиска');
            }
        });
        document.getElementById('toolbarFillBtn').addEventListener('click', () => {
            const value = document.getElementById('toolbarFillValue').value;
            if (value !== undefined && value !== null) {
                this.clipboard.fillSelection(value);
            } else {
                this.core.showToast('⚠️ Введите значение для заполнения');
            }
        });

        // ============================================================
        // КЛИКИ ПО ЗАГОЛОВКАМ (ЧЕРЕЗ addEventListener)
        // ============================================================
        // Делегирование событий на таблице
        document.getElementById('dataTable').addEventListener('click', (e) => {
            const target = e.target.closest('th, td');
            if (!target) return;

            // Обработка уголка (выделение всего)
            if (target.classList.contains('corner-header')) {
                this.selection.selectAll();
                return;
            }

            // Обработка заголовков колонок
            if (target.classList.contains('col-header')) {
                const colIndex = parseInt(target.dataset.colIndex);
                if (!isNaN(colIndex)) {
                    this.selection.selectColumn(colIndex);
                }
                return;
            }

            // Обработка заголовков строк
            if (target.classList.contains('row-header') && !target.classList.contains('corner-header')) {
                const rowIndex = parseInt(target.dataset.rowIndex);
                if (!isNaN(rowIndex)) {
                    this.selection.selectRow(rowIndex);
                }
                return;
            }
        });

        // ============================================================
        // ОБРАБОТЧИКИ МЫШИ ДЛЯ DRAG-ВЫДЕЛЕНИЯ
        // ============================================================
        const table = document.getElementById('dataTable');
        table.addEventListener('mousedown', (e) => {
            const cell = e.target.closest('.data-cell');
            if (!cell) return;
            if (e.button !== 0) return;
            
            e.preventDefault();
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.selection.isMouseDown = true;
            
            if (e.shiftKey && this.selection.selectedCell) {
                this.selection.expandSelection(row, col);
            } else {
                this.selection.startDrag(row, col);
            }
        });

        table.addEventListener('mousemove', (e) => {
            if (!this.selection.isMouseDown || !this.selection.isDragging) return;
            
            const cell = e.target.closest('.data-cell');
            if (!cell) return;
            
            e.preventDefault();
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this.selection.continueDrag(row, col);
        });

        document.addEventListener('mouseup', () => {
            if (this.selection.isMouseDown) {
                this.selection.isMouseDown = false;
                if (this.selection.isDragging) {
                    this.selection.endDrag();
                }
            }
        });

        // ============================================================
        // ОТКЛЮЧЕНИЕ СТАНДАРТНОГО ВЫДЕЛЕНИЯ ТЕКСТА
        // ============================================================
        document.addEventListener('selectstart', (e) => {
            if (e.target.closest('#dataTable')) {
                e.preventDefault();
            }
        });

        this.selection.updateToolbarVisibility();
    }

    // ============================================================
    // ФОРМУЛА-БАР
    // ============================================================
    applyFormula() {
        if (!this.selection.selectedCell) return;

        const value = document.getElementById('formulaInput').value.trim();
        const { row, col } = this.selection.selectedCell;

        this.editCell(row, col, value);
    }

    cancelFormula() {
        if (this.selection.selectedCell) {
            const { row, col } = this.selection.selectedCell;
            const currentData = this.core.data[this.core.currentSheet];
            const rowIndex = row - 1;
            let value = '';
            if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
                value = currentData.rows[rowIndex]?.[col - 1] || '';
            }
            document.getElementById('formulaInput').value = value;
        }
    }

    // ============================================================
    // РЕДАКТИРОВАНИЕ ЯЧЕЙКИ
    // ============================================================
    editCell(row, col, value) {
        document.getElementById('cellInput').value = value || '';
        document.getElementById('editModal').classList.add('active');
        setTimeout(() => document.getElementById('cellInput').focus(), 100);
        this._editingCell = { row, col };
    }

    async saveCellValue() {
        const value = document.getElementById('cellInput').value.trim();
        const { row, col } = this._editingCell || {};

        if (!row || !col) {
            alert('❌ Ошибка: не выбрана ячейка для редактирования');
            return;
        }

        const success = await this.core.saveCellValue(row, col, value);
        if (success) {
            document.getElementById('editModal').classList.remove('active');
            document.getElementById('formulaInput').value = value;
            this.core.showToast('✅ Ячейка обновлена!');
        }
    }
}
