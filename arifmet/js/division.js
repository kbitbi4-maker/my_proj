// version: v1.0 (Вычислительный движок режима деления)
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { getMultiplicationHistoryHTML } from './multiplication.js';

export function initDivisionMode() {
    document.querySelector('.header-menu-btn').innerText = 'Режим: Деление 🍕 ▼';
    generateDivisionExample();
}

export function generateDivisionExample() {
    if (!state.usedExamples) state.usedExamples = [];
    let d1, d2, result, text;
    
    while (true) {
        d2 = Math.floor(Math.random() * 5) + 2; 
        result = Math.floor(Math.random() * 5) + 2; 
        
        d1 = d2 * result; 
        text = `${d1}÷${d2}`;
        
        if (!state.usedExamples.includes(text)) break;
    }
    
    state.usedExamples.push(text);
    state.addExample({ exampleText: text, correctValue: result, currentInput: '' });

    GameCanvas.clearZone();
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getMultiplicationHistoryHTML);
    GameCanvas.clearZone();
}

