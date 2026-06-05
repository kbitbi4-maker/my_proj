// version: v1.5
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { VisualEngine } from './visual_engine.js';

let isAddition = true;

export function initTensMode() {
    document.querySelector('.header-menu-btn').innerText = state.currentMode === 'hundreds' ? 'Режим: Сотни 🛠️ ▼' : 'Режим: Десятки ▼';
    generateExample();
}

export function generateExample() {
    if (state.currentMode !== 'tens' && state.currentMode !== 'mix' && state.currentMode !== 'hundreds') return;
    if (!state.usedExamples) state.usedExamples = [];
    let num1, num2, correctValue, text;

    const isH = state.currentMode === 'hundreds'; const min = isH ? 100 : 10; const max = isH ? 900 : 90;

    if (isAddition) {
        while (true) {
            num1 = Math.floor(Math.random() * max) + min; num2 = Math.floor(Math.random() * max) + min;
            let sum = num1 + num2;
            if ((num1 % 10 + num2 % 10) > 10 && sum < (isH ? 1000 : 100)) { text = `${num1}+${num2}`; if (!state.usedExamples.includes(text)) { correctValue = sum; break; } }
        }
    } else {
        while (true) {
            num1 = Math.floor(Math.random() * max) + min; num2 = Math.floor(Math.random() * max) + min;
            if (num1 > num2 && (num2 % 10) !== 0) { text = `${num1}-${num2}`; if (!state.usedExamples.includes(text)) { correctValue = num1 - num2; break; } }
        }
    }

    state.usedExamples.push(text);
    state.addExample({ exampleText: text, correctValue: correctValue, currentInput: '' });
    isAddition = !isAddition;

    GameCanvas.clearZone();
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getTensHistoryHTML);
    VisualEngine.render(state.getContext());
}

export function getTensHistoryHTML(item, index, mode) {
    const parts = item.currentInput.split('='), simText = parts[0] || '', finText = parts[1] || '';
    const report = state.validateCurrentInput(index), targetLen = String(item.correctValue).length;
    let simHTML = item.currentInput.includes('=') ? ` = <span class="block ${report.simCorrect ? 'block-correct' : 'block-incorrect'}">${simText || '?'}</span>` : ` = <span class="block">${simText || '_'}</span>`;
    let finHTML = parts.length > 1 ? ` = <span class="block ${finText.trim().length >= targetLen && report.finCorrect ? 'block-correct' : (finText.trim().length >= targetLen ? 'block-incorrect' : '')}">${finText || '_'}</span>` : '';
    return { simHTML, finHTML };
}
