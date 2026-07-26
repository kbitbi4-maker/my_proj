// script.js - Управление таблицей и синхронизацией

class TableManager {
    constructor() {
        this.apiUrl = localStorage.getItem('gt_api_url') || '';
        this.data = { headers: [], rows: [] };
        this.editingCell = null;
        this.init();
    }

    init() {
        // Загружаем сохраненный URL
        if (this.apiUrl) {
            this.loadData();
        } else {
            document.getElementById('loadingIndicator').innerHTML = 
                '<i class="fas fa-exclamation-triangle"></i> Настройте API URL в разделе "Настройки"';
        }

        // Вешаем обработчики
        this.bindEvents();
    }

    bindEvents() {
        // Синхронизация (кнопка облачка)
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncData();
        });

        // Обновление (кнопка refresh)
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData();
        });

        // Меню навигации (WhatsApp style)
        document.querySelectorAll('.main-nav li').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.main-nav li').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                const page = item.dataset.page;
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(`page-${page}`).classList.add('active');
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

        // Сохранение настроек
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            const url = document.getElementById('apiUrl').value.trim();
            if (url) {
                this.apiUrl = url;
                localStorage.setItem('gt_api_url', url);
                alert('Настройки сохранены!');
                this.loadData();
            } else {
                alert('Введите корректный URL');
            }
        });

        // Загружаем URL в поле настроек
        if (this.apiUrl) {
            document.getElementById('apiUrl').value = this.apiUrl;
        }
    }

    // Загрузка данных из Google Sheets
    async loadData() {
        if (!this.apiUrl) {
            alert('Сначала настройте API URL в разделе "Настройки"');
            return;
        }

        const loading = document.getElementById('loadingIndicator');
        loading.style.display = 'flex';
        loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка данных...';

        try {
            const response = await fetch(`${this.apiUrl}?action=getSheetData`);
            const text = await response.text();
            
            // Парсим ответ (Google Apps Script возвращает строку JSON)
            const result = JSON.parse(text);
            
            if (result.error) {
                throw new Error(result.error);
            }

            if (result.success) {
                this.data = {
                    headers: result.headers,
                    rows: result.rows
                };
                this.renderTable();
                this.updateStats();
                this.updateOverview();
                this.showSyncStatus(true);
            } else {
                throw new Error('Неизвестный ответ от сервера');
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            loading.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Ошибка: ${error.message}`;
            this.showSyncStatus(false);
        } finally {
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }

    // Синхронизация (ручное обновление)
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

        // Анимация подтверждения
        btn.style.background = 'rgba(76, 175, 80, 0.4)';
        setTimeout(() => {
            btn.style.background = '';
        }, 1000);
    }

    // Отрисовка таблицы
    renderTable() {
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        // Заголовки
        thead.innerHTML = `<tr>${this.data.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        // Строки
        tbody.innerHTML = this.data.rows.map((row, rowIndex) => {
            return `<tr>
                ${row.map((cell, colIndex) => 
                    `<td data-row="${rowIndex + 2}" data-col="${colIndex + 1}" 
                        onclick="tableManager.editCell(${rowIndex + 2}, ${colIndex + 1})">
                        ${cell !== undefined && cell !== null ? cell : ''}
                    </td>`
                ).join('')}
            </tr>`;
        }).join('');
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
                mode: 'no-cors', // Важно для Google Apps Script
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=updateCell&row=${row}&col=${col}&value=${encodeURIComponent(value)}`
            });

            // Google Apps Script возвращает пустой ответ из-за no-cors
            // Поэтому просто обновляем локально и синхронизируем
            const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.textContent = value;
                // Обновляем данные в памяти
                this.data.rows[row - 2][col - 1] = value;
            }

            document.getElementById('editModal').classList.remove('active');
            
            // Показываем уведомление
            this.showToast('Ячейка обновлена!');
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении. Проверьте консоль.');
        }
    }

    // Обновление статистики
    updateStats() {
        document.getElementById('rowCount').textContent = `Строк: ${this.data.rows.length}`;
        document.getElementById('colCount').textContent = `Колонок: ${this.data.headers.length}`;
        document.getElementById('lastSync').textContent = 
            `Последняя синхронизация: ${new Date().toLocaleString()}`;
    }

    // Обновление страницы обзора
    updateOverview() {
        document.getElementById('totalRecords').textContent = this.data.rows.length;
        document.getElementById('dataStatus').textContent = 
            this.data.rows.length > 0 ? '✅ Данные загружены' : '⏳ Нет данных';
    }

    // Статус синхронизации
    showSyncStatus(success) {
        const status = document.querySelector('.sync-status');
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
