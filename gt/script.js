// script.js - ОБНОВЛЕННАЯ ВЕРСИЯ С JSON КАК PLAIN TEXT
// ОТПРАВЛЯЕТ POST КАК text/plain ДЛЯ ОБХОДА CORS

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
        this.editingCell = null;
        this.init();
    }

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
        this.createSheetSelector();
    }

    bindEvents() {
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => { this.syncData(); });
        }

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => { this.loadData(); });
        }

        document.querySelectorAll('.main-nav li').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.main-nav li').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const page = item.dataset.page;
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                const targetPage = document.getElementById(`page-${page}`);
                if (targetPage) targetPage.classList.add('active');
            });
        });

        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                document.getElementById('editModal').classList.remove('active');
            });
        }
        
        const cancelBtn = document.getElementById('cancelCellBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('editModal').classList.remove('active');
            });
        }
        
        const saveBtn = document.getElementById('saveCellBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCellValue();
            });
        }

        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
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
        }

        const apiUrlInput = document.getElementById('apiUrl');
        if (apiUrlInput && this.apiUrl) {
            apiUrlInput.value = this.apiUrl;
        }
    }

    createSheetSelector() {
        const container = document.querySelector('.table-container');
        if (!container) return;

        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'sheet-selector';
        selectorDiv.style.cssText = `
            display: flex; gap: 8px; padding: 10px 15px;
            background: #f8f9fa; border-bottom: 2px solid #e0e0e0;
            flex-wrap: wrap;
        `;

        const sheetNames = ['sheet1', 'sheet2', 'sheet3', 'sheet4'];
        const sheetLabels = ['Лист 1', 'Лист 2', 'Лист 3', 'Лист 4'];

        sheetNames.forEach((name, index) => {
            const btn = document.createElement('button');
            btn.textContent = sheetLabels[index];
            btn.dataset.sheet = name;
            btn.style.cssText = `
                padding: 6px 16px; border: 2px solid #ddd; border-radius: 20px;
                background: ${name === this.currentSheet ? '#075e54' : 'white'};
                color: ${name === this.currentSheet ? 'white' : '#333'};
                cursor: pointer; font-size: 13px; transition: all 0.2s;
                font-weight: ${name === this.currentSheet ? '600' : '400'};
            `;
            
            btn.addEventListener('mouseenter', () => {
                if (name !== this.currentSheet) {
                    btn.style.background = '#f0f0f0';
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (name !== this.currentSheet) {
                    btn.style.background = 'white';
                }
            });
            
            btn.addEventListener('click', () => {
                this.switchSheet(name);
                document.querySelectorAll('.sheet-selector button').forEach(b => {
                    const sheetName = b.dataset.sheet;
                    b.style.background = sheetName === name ? '#075e54' : 'white';
                    b.style.color = sheetName === name ? 'white' : '#333';
                    b.style.fontWeight = sheetName === name ? '600' : '400';
                });
            });
            
            selectorDiv.appendChild(btn);
        });

        const tableContainer = container.querySelector('#dataTable');
        if (tableContainer) {
            container.insertBefore(selectorDiv, tableContainer);
        } else {
            container.prepend(selectorDiv);
        }
    }

    switchSheet(sheetName) {
        this.currentSheet = sheetName;
        this.renderTable();
        this.updateStats();
    }

    // ============================================
    // ЗАГРУЗКА ДАННЫХ (GET)
    // ============================================
    async loadData() {
        if (!this.apiUrl) {
            alert('❌ Сначала настройте API URL в разделе "Настройки"');
            return;
        }

        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.style.display = 'flex';
            loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка данных...';
        }

        console.log('📤 GET запрос к:', this.apiUrl);

        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status}`);
            }

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(`Невалидный JSON: ${text.substring(0, 100)}...`);
            }

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
                if (loading) loading.style.display = 'none';
            } else {
                throw new Error('Неизвестная структура ответа');
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            if (loading) {
                loading.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                    <span>❌ Ошибка: ${error.message}</span>
                `;
                loading.style.display = 'flex';
            }
            this.showSyncStatus(false);
        }
    }

    async syncData() {
        const btn = document.getElementById('syncBtn');
        if (!btn) return;
        
        const icon = btn.querySelector('i');
        const status = btn.querySelector('.sync-status');
        
        if (icon) icon.classList.add('fa-spin');
        if (status) status.textContent = 'Синхр...';
        btn.disabled = true;

        await this.loadData();

        if (icon) icon.classList.remove('fa-spin');
        if (status) status.textContent = 'Синхр.';
        btn.disabled = false;

        btn.style.background = 'rgba(76, 175, 80, 0.4)';
        setTimeout(() => { btn.style.background = ''; }, 1000);
    }

    renderTable() {
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        if (!thead || !tbody) return;

        const currentData = this.data[this.currentSheet] || { headers: [], rows: [] };
        const headers = currentData.headers || [];
        const rows = currentData.rows || [];

        if (headers.length > 0) {
            thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        } else {
            thead.innerHTML = '<tr><th>Нет данных</th></tr>';
        }

        if (rows.length > 0) {
            tbody.innerHTML = rows.map((row, rowIndex) => {
                const actualRow = rowIndex + 2;
                return `<tr>
                    ${row.map((cell, colIndex) => {
                        const actualCol = colIndex + 1;
                        return `<td data-row="${actualRow}" data-col="${actualCol}" 
                            onclick="tableManager.editCell(${actualRow}, ${actualCol})">
                            ${cell !== undefined && cell !== null ? cell : ''}
                        </td>`;
                    }).join('')}
                </tr>`;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:30px; color:#999;">Нет данных для отображения</td></tr>';
        }

        const sheetLabels = { sheet1: 'Лист "1"', sheet2: 'Лист "2"', sheet3: 'Лист "3"', sheet4: 'Лист "4"' };
        const titleElement = document.querySelector('.app-title');
        if (titleElement) {
            titleElement.textContent = `Таблица (${sheetLabels[this.currentSheet] || this.currentSheet})`;
        }
    }

    editCell(row, col) {
        this.editingCell = { row, col };
        const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            document.getElementById('cellInput').value = cell.textContent.trim();
            document.getElementById('editModal').classList.add('active');
            setTimeout(() => document.getElementById('cellInput').focus(), 100);
        }
    }

    // ============================================
    // СОХРАНЕНИЕ ЯЧЕЙКИ (POST как text/plain)
    // ============================================
    async saveCellValue() {
        const value = document.getElementById('cellInput').value.trim();
        const { row, col } = this.editingCell;

        if (!this.apiUrl) {
            alert('API URL не настроен');
            return;
        }

        const sheetNumber = this.currentSheet.replace('sheet', '');

        try {
            // Формируем JSON данные
            const jsonData = {
                action: 'updateCell',
                sheet: sheetNumber,
                row: row,
                col: col,
                value: value
            };

            console.log('📤 Отправка POST (JSON как plain text):', jsonData);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain', // КЛЮЧЕВОЙ МОМЕНТ: обход CORS
                },
                body: JSON.stringify(jsonData) // JSON, но отправляем как текст
            });

            const text = await response.text();
            console.log('📥 Ответ сервера:', text);
            
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('❌ Невалидный JSON:', text);
                throw new Error('Сервер вернул невалидный ответ');
            }

            if (result.success) {
                // Обновляем локальные данные
                const currentData = this.data[this.currentSheet];
                const rowIndex = row - 2;
                if (currentData.rows[rowIndex] && currentData.rows[rowIndex][col - 1] !== undefined) {
                    currentData.rows[rowIndex][col - 1] = value;
                }
                
                this.renderTable();
                document.getElementById('editModal').classList.remove('active');
                this.showToast('✅ Ячейка обновлена!');
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }

        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            alert('❌ Ошибка при сохранении: ' + error.message);
        }
    }

    updateStats() {
        const currentData = this.data[this.currentSheet] || { headers: [], rows: [] };
        document.getElementById('rowCount').textContent = `Строк: ${currentData.rows.length}`;
        document.getElementById('colCount').textContent = `Колонок: ${currentData.headers.length}`;
        document.getElementById('lastSync').textContent = 
            `Последняя синхронизация: ${new Date().toLocaleString()}`;
    }

    updateOverview() {
        let totalRecords = 0;
        ['sheet1', 'sheet2', 'sheet3', 'sheet4'].forEach(key => {
            totalRecords += this.data[key].rows.length;
        });
        document.getElementById('totalRecords').textContent = totalRecords;
        document.getElementById('dataStatus').textContent = 
            totalRecords > 0 ? '✅ Данные загружены' : '⏳ Нет данных';
    }

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

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #323232; color: white; padding: 12px 24px;
            border-radius: 8px; font-size: 14px; z-index: 9999;
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

let tableManager;
document.addEventListener('DOMContentLoaded', () => {
    tableManager = new TableManager();
});
