import { state } from './state.js';
import { generateExample } from './tens.js';
import { generateMultiExample } from './multiplication.js';

export function initMixMode() {
    document.querySelector('.header-menu-btn').innerText = 'Режим: Микс 🎰 ▼';
    state.mixStep = 0;
    generateMixExample();
}

export function generateMixExample() {
    if (state.currentMode !== 'mix') return;
    let type = state.mixStep % 3;
    
    // Вызываем нужный генератор примеров из его родного модуля
    if (type === 0 || type === 1) {
        // Шаг 0 и 1 — это сложение и вычитание из tens.js
        generateExample();
    } else if (type === 2) {
        // Шаг 2 — это умножение из multiplication.js
        generateMultiExample();
    }
    
    document.querySelector('.header-menu-btn').innerText = 'Режим: Микс 🎰 ▼';
    state.mixStep++;
}

