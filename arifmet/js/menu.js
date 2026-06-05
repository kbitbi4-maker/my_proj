// version: v1.1 - Original Menu Sliding Logic
import { initTensGame } from './tens.js';
import { initMultiplicationGame } from './multiplication.js';
import { initMixGame } from './mix.js';

export function toggleMenuMode() {
    const menu = document.getElementById('modes-menu-container');
    const numpad = document.getElementById('calc-numpad-container');
    const rightArea = document.querySelector('.right-area');
    const toggleBtn = document.getElementById('menu-toggle-btn');

    if (!menu || !numpad || !rightArea) return;

    if (menu.style.display === 'none') {
        menu.style.display = 'flex';
        numpad.style.display = 'none';
        rightArea.classList.add('menu-active');
        if (toggleBtn) toggleBtn.textContent = 'Режим: Закрыть ▲';
    } else {
        menu.style.display = 'none';
        numpad.style.display = 'grid';
        rightArea.classList.remove('menu-active');
        if (toggleBtn) toggleBtn.textContent = 'Режим: Выбрать ▼';
    }
}

export function handleModeSelection(mode) {
    toggleMenuMode();
    
    const placeholder = document.getElementById('history-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    if (mode === 'tens') {
        initTensGame('tens');
    } else if (mode === 'hundreds') {
        initTensGame('hundreds');
    } else if (mode === 'multiplication') {
        initMultiplicationGame();
    } else if (mode === 'mix') {
        initMixGame();
    }
}
