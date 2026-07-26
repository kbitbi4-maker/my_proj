// script.js - ОБНОВЛЕННАЯ ВЕРСИЯ ДЛЯ РАБОТЫ С НОВЫМ API
// Теперь получает ВСЕ 4 листа одним запросом

class TableManager {
    constructor() {
        this.apiUrl = localStorage.getItem('gt_api_url') || '';
        this.data = { 
            sheet1: { headers: [], rows: [] },
            sheet2: { headers: [], rows: [] },
            sheet3: { headers: [], rows: [] },
            sheet4: { headers: [], rows: [] }
        };
        this.currentSheet = 'sheet1'; // Активный лист
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
        // Синхронизация (кнопка облачка)
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                this.syncData();
            });
        }

        // Обновление (кнопка refresh)
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadData();
            });
        }

        // Навигация по страницам
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

        // Модальное окно редактирования
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

        // Сохранение настроек
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

        // Загружаем URL в поле настроек
        const apiUrlInput = document.getElementById('apiUrl');
        if (apiUrlInput && this.apiUrl) {
            apiUrlInput.value = this.apiUrl;
        }
    }

    // Создание переключателя листов
    createSheetSelector() {
        const container = document.querySelector('.table-container');
        if (!container) return;

        // Создаем панель для переключения листов
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'sheet-selector';
        selectorDiv.style.cssText = `
            display: flex;
            gap: 8px;
            padding: 10px 15px;
            background: #f8f9fa;
            border-bottom: 2px solid #e0e0e0;
            flex-wrap: wrap;
        `;

        const sheetNames = ['sheet1', 'sheet2', 'sheet3', 'sheet4'];
        const sheetLabels = ['Лист 1', 'Лист 2', 'Лист 3', 'Лист 4'];

        sheetNames.forEach((name, index) => {
            const btn = document.createElement('button');
            btn.textContent = sheetLabels[index];
            btn.dataset.sheet = name;
            btn.style.cssText = `
                padding: 6px 16px;
                border: 2px solid #ddd;
                border-radius: 20px;
                background: ${name === this.currentSheet ? '#075e54' : 'white'};
                color: ${name === this.currentSheet ? 'white' : '#333'};
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
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
                // Обновляем стили кнопок
                document.querySelectorAll('.sheet-selector button').forEach(b => {
                    const sheetName = b.dataset.sheet;
                    b.style.background = sheetName === name ? '#075e54' : 'white';
                    b.style.color = sheetName === name ? 'white' : '#333';
                    b.style.fontWeight = sheetName === name ? '600' : '400';
                });
            });
            
            selectorDiv.appendChild(btn);
        });

        // Вставляем перед таблицей
        const tableContainer = container.querySelector('#dataTable');
        if (tableContainer) {
            container.insertBefore(selectorDiv, tableContainer);
        } else {
            container.prepend(selectorDiv);
        }
    }

    // Переключение между листами
    switchSheet(sheetName) {
        this.currentSheet = sheetName;
        this.renderTable();
        this.updateStats();
    }

    // Загрузка данных из Google Sheets
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

        console.log('📤 Отправка запроса к:', this.apiUrl);

        try {
            const response = await fetch(this.apiUrl);
            console.log('📥 Статус ответа:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status}`);
            }

            const text = await response.text();
            console.log('📄 Ответ от сервера получен (длина):', text.length);

            // Парсим JSON
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(`Не удалось разобрать JSON: ${text.substring(0, 100)}...`);
            }

            console.log('✅ Данные загружены, ключи:', Object.keys(result));

            // Проверяем структуру ответа
            if (result.sheet1 || result.sheet2 || result.sheet3 || result.sheet4) {
                // Обрабатываем каждый лист
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

                console.log('📊 Данные загружены:', {
                    sheet1: this.data.sheet1.rows.length,
                    sheet2: this.data.sheet2.rows.length,
                    sheet3: this.data.sheet3.rows.length,
                    sheet4: this.data.sheet4.rows.length
                });

                this.renderTable();
                this.updateStats();
                this.updateOverview();
                this.showSyncStatus(true);
                if (loading) loading.style.display = 'none';
            } else {
                throw new Error('Неизвестная структура ответа. Ожидались ключи: sheet1, sheet2, sheet3, sheet4');
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            if (loading) {
                loading.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                    <span>❌ Ошибка: ${error.message}</span>
                    <br><small style="color: #666; margin-top: 10px; display: block;">
                        Проверьте консоль (F12) для деталей
                    </small>
                `;
                loading.style.display = 'flex';
            }
            this.showSyncStatus(false);
        }
    }

    // Синхронизация (ручное обновление)
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

        // Анимация подтверждения
        btn.style.background = 'rgba(76, 175, 80, 0.4)';
        setTimeout(() => {
            btn.style.background = '';
        }, 1000);
    }

    // Отрисовка таблицы для текущего листа
    renderTable() {
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        if (!thead || !tbody) return;

        const currentData = this.data[this.currentSheet] || { headers: [], rows: [] };
        const headers = currentData.headers || [];
        const rows = currentData.rows || [];

        // Заголовки
        if (headers.length > 0) {
            thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        } else {
            thead.innerHTML = '<tr><th>Нет данных</th></tr>';
        }

        // Строки
        if (rows.length > 0) {
            tbody.innerHTML = rows.map((row, rowIndex) => {
                const actualRow = rowIndex + 2; // +2 потому что строка 1 - заголовки
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

        // Обновляем информацию о текущем листе
        const sheetLabels = {
            sheet1: 'Лист "1"',
            sheet2: 'Лист "2"',
            sheet3: 'Лист "3"',
            sheet4: 'Лист "4"'
        };
        const titleElement = document.querySelector('.app-title');
        if (titleElement) {
            titleElement.textContent = `Таблица (${sheetLabels[this.currentSheet] || this.currentSheet})`;
        }
    }

    // Редактирование ячейки
    editCell(row, col) {
        this.editingCell = { row, col };
        const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            document.getElementById('cellInput').value = cell.textContent.trim();
            document.getElementById('editModal').classList.add('active');
            setTimeout(() => document.getElementById('cellInput').focus(), 100);
        }
    }

    // Сохранение значения ячейки
    async saveCellValue() {
        const value = document.getElementById('cellInput').value.trim();
        const { row, col } = this.editingCell;

        if (!this.apiUrl) {
            alert('API URL не настроен');
            return;
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateCell',
                    sheet: this.currentSheet.replace('sheet', ''), // "1", "2", "3" или "4"
                    row: row,
                    col: col,
                    value: value
                })
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                result = { success: false, error: text };
            }

            if (result.success) {
                // Обновляем локальные данные
                const currentData = this.data[this.currentSheet];
                const rowIndex = row - 2; // Преобразуем в индекс массива
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

    // Обновление статистики
    updateStats() {
        const currentData = this.data[this.currentSheet] || { headers: [], rows: [] };
        const totalRows = currentData.rows.length;
        const totalCols = currentData.headers.length;
        
        document.getElementById('rowCount').textContent = `Строк: ${totalRows}`;
        document.getElementById('colCount').textContent = `Колонок: ${totalCols}`;
        document.getElementById('lastSync').textContent = 
            `Последняя синхронизация: ${new Date().toLocaleString()}`;
    }

    // Обновление страницы обзора
    updateOverview() {
        let totalRecords = 0;
        ['sheet1', 'sheet2', 'sheet3', 'sheet4'].forEach(key => {
            totalRecords += this.data[key].rows.length;
        });
        
        document.getElementById('totalRecords').textContent = totalRecords;
        document.getElementById('dataStatus').textContent = 
            totalRecords > 0 ? '✅ Данные загружены' : '⏳ Нет данных';
    }

    // Статус синхронизации
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

    // Toast уведомление
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

// Инициализация
let tableManager;
document.addEventListener('DOMContentLoaded', () => {
    tableManager = new TableManager();
});
