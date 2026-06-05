// version: v1.3
import { toggleMenuMode, handleModeSelection } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';
// Добавили импорт функции скачивания PDF: downloadProjectMapPDF
import { openProjectMap, closeProjectMap, copyProjectMap, downloadProjectMapPDF } from './project_map.js';

// Слушатели оригинального модального окна карты
document.getElementById('project-map-btn')?.addEventListener('click', openProjectMap);
document.getElementById('close-map-btn')?.addEventListener('click', closeProjectMap);
document.getElementById('copy-map-btn')?.addEventListener('click', copyProjectMap);

// НАЗНАЧАЕМ СЛУШАТЕЛЬ НА НАЖАТИЕ НОВОЙ КНОПКИ СКАЧИВАНИЯ PDF
document.getElementById('download-pdf-btn')?.addEventListener('click', downloadProjectMapPDF);

document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => handleModeSelection(e.currentTarget.getAttribute('data-mode')));
});

document.querySelectorAll('.calc-btn:not(.next)').forEach(btn => {
    btn.addEventListener('click', (e) => pressNum(e.currentTarget.getAttribute('data-key')));
});

document.getElementById('next-example-btn')?.addEventListener('click', confirmAndNext);
