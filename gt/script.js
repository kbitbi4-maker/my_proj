// ============================================================
// script.js - ТОЧКА ВХОДА
// Сборка всех модулей и инициализация
// ============================================================

// Создаем экземпляры классов
const core = new TableCore();
const selection = new TableSelection(core);
const clipboard = new TableClipboard(core, selection);

// Делаем их доступными глобально для onclick в HTML
window.tableCore = core;
window.tableSelection = selection;
window.tableClipboard = clipboard;

// Инициализация UI (привязка всех событий)
const ui = new TableUI(core, selection, clipboard);

console.log('🚀 Приложение инициализировано');
console.log('📦 Модули: core, selection, clipboard, ui');
