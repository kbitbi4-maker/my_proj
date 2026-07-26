// ============================================================
// script.js - ТОЧКА ВХОДА (ИСПРАВЛЕННАЯ)
// Сборка всех модулей и инициализация
// ============================================================

// Создаем экземпляры классов
const core = new TableCore();
const selection = new TableSelection(core);
const clipboard = new TableClipboard(core, selection);

// Делаем их доступными глобально
window.tableCore = core;
window.tableSelection = selection;
window.tableClipboard = clipboard;

// Инициализация UI (привязка всех событий)
const ui = new TableUI(core, selection, clipboard);

// РУЧНОЙ ЗАПУСК ЗАГРУЗКИ ПОСЛЕ ИНИЦИАЛИЗАЦИИ
// Ждем, пока все модули зарегистрируются
setTimeout(() => {
    if (core.apiUrl) {
        core.loadData();
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
}, 100);

console.log('🚀 Приложение инициализировано');
console.log('📦 Модули: core, selection, clipboard, ui');
