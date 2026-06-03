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
    
    if (type === 0 || type === 1) {
        generateExample();
    } else if (type === 2) {
        generateMultiExample();
    }
    
    document.querySelector('.header-menu-btn').innerText = 'Режим: Микс 🎰 ▼';
    state.mixStep++;
}
