// ============================================================
// formula-sync.js - СИНХРОНИЗАЦИЯ ФОРМУЛ С GOOGLE
// Отправка формул, получение результатов, проверка совпадения
// ============================================================

class FormulaSync {
    constructor(apiUrl, engine) {
        this.apiUrl = apiUrl;
        this.engine = engine;
        this.pendingSyncs = new Map(); // { key: { formula, localResult, googleResult, status } }
        this.syncStatus = {}; // { "sheet1_5_3": { status: "ok" | "error" | "pending", message: "" } }
    }

    // ============================================================
    // ОТПРАВИТЬ ФОРМУЛУ В GOOGLE И ПРОВЕРИТЬ
    // ============================================================
    async syncFormula(sheet, row, col, formula, localResult) {
        const key = `${sheet}_${row}_${col}`;
        
        // Помечаем как ожидание
        this.syncStatus[key] = { status: 'pending', message: 'Синхронизация...' };
        this.notifyUI(key);

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'setFormula',
                    sheet: sheet,
                    row: row,
                    col: col,
                    formula: formula
                })
            });

            const text = await response.text();
            const result = JSON.parse(text);

            if (result.success) {
                const googleResult = result.value;
                
                // Сравниваем результаты
                const match = this.compareResults(localResult, googleResult);
                
                if (match) {
                    this.syncStatus[key] = { 
                        status: 'ok', 
                        message: '✅ Значения совпадают',
                        local: localResult,
                        google: googleResult
                    };
                } else {
                    this.syncStatus[key] = { 
                        status: 'error', 
                        message: `❌ Значения не совпадают: сайт=${localResult}, Google=${googleResult}`,
                        local: localResult,
                        google: googleResult
                    };
                }
            } else {
                this.syncStatus[key] = { 
                    status: 'error', 
                    message: `❌ Ошибка Google: ${result.error || 'Неизвестная ошибка'}` 
                };
            }
        } catch (error) {
            this.syncStatus[key] = { 
                status: 'error', 
                message: `❌ Ошибка сети: ${error.message}` 
            };
        }

        this.notifyUI(key);
        return this.syncStatus[key];
    }

    // ============================================================
    // СРАВНЕНИЕ РЕЗУЛЬТАТОВ
    // ============================================================
    compareResults(local, google) {
        // Если оба числа — сравниваем с погрешностью
        if (typeof local === 'number' && typeof google === 'number') {
            return Math.abs(local - google) < 0.0001;
        }
        // Если оба массива — сравниваем поэлементно
        if (Array.isArray(local) && Array.isArray(google)) {
            return this.compareArrays(local, google);
        }
        // Иначе — строгое сравнение
        return String(local) === String(google);
    }

    compareArrays(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (Array.isArray(arr1[i]) && Array.isArray(arr2[i])) {
                if (!this.compareArrays(arr1[i], arr2[i])) return false;
            } else if (arr1[i] !== arr2[i]) {
                return false;
            }
        }
        return true;
    }

    // ============================================================
    // ПОЛУЧИТЬ ВСЕ ФОРМУЛЫ ИЗ GOOGLE
    // ============================================================
    async fetchFormulasFromGoogle(sheet) {
        try {
            const response = await fetch(`${this.apiUrl}?action=getFormulas&sheet=${sheet}`);
            const text = await response.text();
            const result = JSON.parse(text);
            return result.success ? result.formulas : null;
        } catch (error) {
            console.error('Ошибка загрузки формул из Google:', error);
            return null;
        }
    }

    // ============================================================
    // СИНХРОНИЗИРОВАТЬ ВСЕ ФОРМУЛЫ НА ЛИСТЕ
    // ============================================================
    async syncAllFormulas(sheetName, formulas) {
        const results = [];
        for (const key in formulas) {
            const [row, col] = key.split('_').map(Number);
            const formula = formulas[key];
            const localResult = this.engine.evaluate(formula, sheetName);
            const result = await this.syncFormula(sheetName, row, col, formula, localResult);
            results.push(result);
        }
        return results;
    }

    // ============================================================
    // ПРОВЕРИТЬ ВСЕ ФОРМУЛЫ (БЕЗ ОТПРАВКИ)
    // ============================================================
    checkAllFormulas(sheetName, formulas) {
        const results = {};
        for (const key in formulas) {
            const [row, col] = key.split('_').map(Number);
            const formula = formulas[key];
            const localResult = this.engine.evaluate(formula, sheetName);
            results[key] = {
                formula: formula,
                localResult: localResult,
                status: 'checked'
            };
        }
        return results;
    }

    // ============================================================
    // УВЕДОМЛЕНИЕ UI ОБ ИЗМЕНЕНИИ СТАТУСА
    // ============================================================
    notifyUI(key) {
        const status = this.syncStatus[key];
        if (!status) return;

        // Находим ячейку в DOM
        const [sheet, row, col] = key.split('_');
        const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;

        // Удаляем старые индикаторы
        cell.querySelectorAll('.formula-status').forEach(el => el.remove());

        // Создаём индикатор
        const indicator = document.createElement('span');
        indicator.className = 'formula-status';
        indicator.style.cssText = `
            position: absolute;
            top: 2px;
            right: 4px;
            font-size: 10px;
            pointer-events: none;
            z-index: 5;
        `;

        if (status.status === 'pending') {
            indicator.textContent = '⏳';
            indicator.style.color = '#f9a825';
        } else if (status.status === 'ok') {
            indicator.textContent = '✅';
            indicator.style.color = '#43a047';
        } else if (status.status === 'error') {
            indicator.textContent = '❌';
            indicator.style.color = '#e53935';
            // Показываем всплывающую подсказку
            cell.title = status.message;
        }

        cell.appendChild(indicator);
    }

    // ============================================================
    // ОЧИСТИТЬ СТАТУСЫ ДЛЯ ЛИСТА
    // ============================================================
    clearStatuses(sheetName) {
        for (const key in this.syncStatus) {
            if (key.startsWith(sheetName)) {
                delete this.syncStatus[key];
            }
        }
        // Удаляем индикаторы из DOM
        document.querySelectorAll('.formula-status').forEach(el => el.remove());
    }

    // ============================================================
    // ПОЛУЧИТЬ СТАТИСТИКУ СИНХРОНИЗАЦИИ
    // ============================================================
    getSyncStats(sheetName) {
        let total = 0;
        let ok = 0;
        let errors = 0;
        let pending = 0;

        for (const key in this.syncStatus) {
            if (key.startsWith(sheetName)) {
                total++;
                const status = this.syncStatus[key].status;
                if (status === 'ok') ok++;
                else if (status === 'error') errors++;
                else if (status === 'pending') pending++;
            }
        }

        return { total, ok, errors, pending };
    }
}
