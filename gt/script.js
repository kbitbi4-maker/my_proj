// ============================================================
// script.js - ТОЧКА ВХОДА (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ)
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

// ЗАГРУЗКА ДАННЫХ (с проверкой на наличие URL и инициализацию)
function initializeApp() {
    if (core.apiUrl) {
        // Небольшая задержка для гарантии, что все обработчики привязаны
        setTimeout(() => {
            core.loadData();
        }, 50);
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
}

// Запускаем приложение
initializeApp();

console.log('🚀 Приложение инициализировано');
console.log('📦 Модули: core, selection, clipboard, ui');
console.log('📡 API URL:', core.apiUrl || 'не настроен');
