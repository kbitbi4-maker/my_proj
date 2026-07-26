// ============================================================
// formula-sync.js - СИНХРОНИЗАЦИЯ ФОРМУЛ С GOOGLE
// Отправка формул, получение результатов, проверка совпадения
// ============================================================

class FormulaSync {
    constructor(apiUrl, engine) {
        this.apiUrl = apiUrl;
        this.engine = engine;
        this.syncStatus = {};
    }

    async syncFormula(sheet, row, col, formula, localResult) {
        const key = `${sheet}_${row}_${col}`;
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

    compareResults(local, google) {
        if (typeof local === 'number' && typeof google === 'number') {
            return Math.abs(local - google) < 0.0001;
        }
        if (Array.isArray(local) && Array.isArray(google)) {
            return this.compareArrays(local, google);
        }
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

    notifyUI(key) {
        const status = this.syncStatus[key];
        if (!status) return;
        const [sheet, row, col] = key.split('_');
        const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        cell.querySelectorAll('.formula-status').forEach(el => el.remove());
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
            cell.title = status.message;
        }
        cell.appendChild(indicator);
    }

    clearStatuses() {
        for (const key in this.syncStatus) {
            delete this.syncStatus[key];
        }
        document.querySelectorAll('.formula-status').forEach(el => el.remove());
    }

    getSyncStats(sheetName) {
        let total = 0, ok = 0, errors = 0, pending = 0;
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
