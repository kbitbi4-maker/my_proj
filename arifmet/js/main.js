// version: v1.3
import { toggleMenuMode, handleModeSelection } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';
import { selectExample } from './view_dispatcher.js';

// ИСПРАВЛЕНО: Кнопка на главном экране строго открывает штатную модалку карты проекта, как это и было изначально
document.getElementById('project-map-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('map-modal');
    if (modal) modal.style.display = 'flex';
});

// Закрытие модалки карты проекта
document.getElementById('close-map-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('map-modal');
    if (modal) modal.style.display = 'none';
});

document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => handleModeSelection(e.currentTarget.getAttribute('data-mode')));
});

document.querySelectorAll('.calc-btn:not(.next)').forEach(btn => {
    btn.addEventListener('click', (e) => pressNum(e.currentTarget.getAttribute('data-key')));
});

document.getElementById('next-example-btn')?.addEventListener('click', confirmAndNext);
