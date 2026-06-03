// version: v1.1
import { toggleMenuMode, handleModeSelection } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';
import { openProjectMap, closeProjectMap, copyProjectMap } from './project_map.js';

// Навешиваем клики для управления модальным окном карты проекта
document.getElementById('project-map-btn')?.addEventListener('click', openProjectMap);
document.getElementById('close-map-btn')?.addEventListener('click', closeProjectMap);
document.getElementById('copy-map-btn')?.addEventListener('click', copyProjectMap);

// Навешиваем клик на кнопку меню в шапке
document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);

// Навешиваем переключение режимов на кнопки меню
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => handleModeSelection(e.currentTarget.getAttribute('data-mode')));
});

// Навешиваем ввод символов на цифровые кнопки
document.querySelectorAll('.calc-btn:not(.next)').forEach(btn => {
    btn.addEventListener('click', (e) => pressNum(e.currentTarget.getAttribute('data-key')));
});

// Навешиваем клик на кнопку перехода к следующему примеру
document.getElementById('next-example-btn')?.addEventListener('click', confirmAndNext);
