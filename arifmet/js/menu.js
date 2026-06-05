// version: v1.3 - Fixed Modal Popup Menu Logic
import { initTensGame } from './tens.js';
import { initMultiplicationGame } from './multiplication.js';
import { initMixGame } from './mix.js';

export function toggleMenuMode() {
    const backdrop = document.getElementById('modes-menu-backdrop');
    if (backdrop) {
        const isHidden = window.getComputedStyle(backdrop).display === 'none';
        backdrop.style.display = isHidden ? 'flex' : 'none';
    }
}

export function closeMenuModal() {
    const backdrop = document.getElementById('modes-menu-backdrop');
    if (backdrop) backdrop.style.display = 'none';
}

export function handleModeSelection(mode) {
    closeMenuModal();
    
    // Сбрасываем текст заглушки истории примеров
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
