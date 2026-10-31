// version: v1.4 (Добавлен обработчик квадратной кнопки "Назад")
import { toggleMenuMode, handleModeSelection } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';
import { openProjectMap, closeProjectMap, copyProjectMap } from './project_map.js';
import { renderSettings } from './settings.js';

// Слушатели модального окна карты
document.getElementById('project-map-btn')?.addEventListener('click', openProjectMap);
document.getElementById('close-map-btn')?.addEventListener('click', closeProjectMap);
document.getElementById('copy-map-btn')?.addEventListener('click', copyProjectMap);

// Кнопка настроек
document.getElementById('settings-btn')?.addEventListener('click', renderSettings);

// Кнопка "Назад" (возврат в главное меню)
document.getElementById('back-btn')?.addEventListener('click', () => {
    window.location.href = '../index.html';
});

document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => handleModeSelection(e.currentTarget.getAttribute('data-mode')));
});

document.querySelectorAll('.calc-btn:not(.next)').forEach(btn => {
    btn.addEventListener('click', (e) => pressNum(e.currentTarget.getAttribute('data-key')));
});

document.getElementById('next-example-btn')?.addEventListener('click', confirmAndNext);
