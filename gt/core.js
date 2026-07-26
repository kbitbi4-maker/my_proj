// Добавить в constructor
this.engine = new FormulaEngine(this.data);
this.sync = new FormulaSync(this.apiUrl, this.engine);
this.formulaParser = new FormulaParser();

// ============================================================
// ОБНОВЛЁННЫЙ МЕТОД ЗАГРУЗКИ ДАННЫХ (С ФОРМУЛАМИ)
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

            // Обновляем движок формул
            this.engine.setData(this.data);
            this.sync.clearStatuses();

            this.renderTable();
            this.updateStats();
            this.updateOverview();
            loading.style.display = 'none';

            if (this.data[this.currentSheet].rows.length > 0) {
                if (window.tableSelection && typeof window.tableSelection.selectCell === 'function') {
                    window.tableSelection.selectCell(1, 1);
                }
            }
            return true;
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
        return false;
    }
}

// ============================================================
// ОБНОВЛЁННЫЙ МЕТОД СОХРАНЕНИЯ ЯЧЕЙКИ (С ПРОВЕРКОЙ ФОРМУЛ)
// ============================================================
async saveCellValue(row, col, value) {
    if (!this.apiUrl) {
        alert('API URL не настроен');
        return false;
    }

    const sheetNumber = this.currentSheet.replace('sheet', '');
    const sheetName = this.currentSheet;

    try {
        // Если значение — формула
        if (this.formulaParser.isFormula(value)) {
            // Вычисляем локально
            const localResult = this.engine.evaluate(value, sheetName);
            
            // Отображаем результат в ячейке
            const currentData = this.data[sheetName];
            const rowIndex = row - 1;
            if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
                if (currentData.rows[rowIndex].length < col) {
                    currentData.rows[rowIndex].length = col;
                }
                // Сохраняем формулу в данных
                currentData.rows[rowIndex][col - 1] = value;
            }

            // Синхронизируем с Google
            const syncResult = await this.sync.syncFormula(sheetNumber, row, col, value, localResult);
            
            if (syncResult.status === 'error') {
                console.warn('⚠️ Синхронизация формулы не удалась:', syncResult.message);
                // Показываем предупреждение, но не блокируем работу
            }

            this.renderTable();
            return true;
        } else {
            // Обычное значение — просто сохраняем
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
                const currentData = this.data[sheetName];
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
        }

    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        alert('❌ Ошибка при сохранении: ' + error.message);
        return false;
    }
}
