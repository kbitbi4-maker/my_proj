// version: v1.5 - Integrated Modal Menu Event Handlers
import { toggleMenuMode, handleModeSelection, closeMenuModal } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';
import { openProjectMap, closeProjectMap, copyProjectMap, downloadProjectMapPDF } from './project_map.js';

// Слушатели оригинального модального окна карты
document.getElementById('project-map-btn')?.addEventListener('click', openProjectMap);
document.getElementById('project-map-btn-land')?.addEventListener('click', openProjectMap);
document.getElementById('close-map-btn')?.addEventListener('click', closeProjectMap);
document.getElementById('copy-map-btn')?.addEventListener('click', copyProjectMap);
document.getElementById('download-pdf-btn')?.addEventListener('click', downloadProjectMapPDF);

// Слушатели модального меню выбора режимов
document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);
document.getElementById('menu-toggle-btn-land')?.addEventListener('click', toggleMenuMode);
document.getElementById('close-menu-modal-btn')?.addEventListener('click', closeMenuModal);
document.getElementById('modes-menu-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'modes-menu-backdrop') closeMenuModal();
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => handleModeSelection(e.currentTarget.getAttribute('data-mode')));
});
document.querySelectorAll('.calc-btn:not(.next)').forEach(btn => {
    btn.addEventListener('click', (e) => pressNum(e.currentTarget.getAttribute('data-key')));
});
document.getElementById('next-example-btn')?.addEventListener('click', confirmAndNext);
