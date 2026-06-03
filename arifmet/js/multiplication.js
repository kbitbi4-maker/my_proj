import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';

let currentMultiTask = null;

export function initMultiplicationMode() {
    document.querySelector('.header-menu-btn').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

export function generateMultiExample() {
    if (!state.usedExamples) state.usedExamples = [];
    let num1, num2, text;
    while (true) {
        num1 = Math.floor(Math.random() * 4) + 2; 
        num2 = Math.floor(Math.random() * 4) + 2; 
        text = `${num1}×${num2}`;
        if (!state.usedExamples.includes(text)) break;
    }
    state.usedExamples.push(text);
    currentMultiTask = { items: num1, monsters: num2 };
    state.addExample({ exampleText: text, correctValue: num1 * num2, currentInput: '' });

    GameCanvas.clearZone();
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getMultiplicationHistoryHTML);
    renderMonsterGame(); 
}

export function syncMonsterGame() {
    if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
    const parts = state.examplesHistory[state.activeIndex].exampleText.split('×');
    currentMultiTask = { items: parseInt(parts.at(0), 10), monsters: parseInt(parts.at(1), 10) };
    GameCanvas.clearZone();
    renderMonsterGame();
}

export function renderMonsterGame() {
    if (!currentMultiTask || state.activeIndex === -1) return GameCanvas.clearZone();
    const report = state.validateCurrentInput();
    const status = report.isFullySolved ? 'win' : (report.isWrongAnswer ? 'sad' : 'play');
    const cacheKey = `${state.examplesHistory[state.activeIndex].exampleText}_${status}`;

    let actorsHTML = '';
    for (let i = 0; i < currentMultiTask.monsters; i++) {
        let contentHTML = '', bg = '#fff7ed', border = '1px dashed #fed7aa', mClass = '';
        if (status === 'win') {
            contentHTML = '<span style="font-size:14px;color:#22c55e;font-weight:bold;animation:fadeIn 0.3s;">Ням-ням! 😋</span>';
            bg = '#dcfce7'; border = '1px dashed #22c55e'; mClass = 'monster-happy';
        } else if (status === 'sad') {
            contentHTML = '<span class="tears-animation" style="font-size:22px;">💦</span>';
            bg = '#eff6ff'; border = '1px dashed #60a5fa'; mClass = 'monster-sad';
        } else {
            contentHTML = '<span style="font-size:22px;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.1));">🍕</span>'.repeat(currentMultiTask.items);
        }
        const subtitleHTML = `<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;max-width:80px;background:${bg};padding:4px 6px;border-radius:6px;border:${border};min-height:32px;align-items:center;">${contentHTML}</div>`;
        actorsHTML += GameCanvas.createActorHTML({ emoji: '👾', animationClass: mClass, subtitle: subtitleHTML });
    }
    GameCanvas.renderZoneScene(actorsHTML, cacheKey);
}

export function getMultiplicationHistoryHTML(item, index, mode) {
    const parts = item.currentInput.split('=');
    const simText = parts.at(0) || '', finText = parts.at(1) || '';
    
    // ПРЯМОЕ ИСПРАВЛЕНИЕ: Передаем индекс строки в валидатор!
    const report = state.validateCurrentInput(index);
    const targetLen = String(item.correctValue).length;
    
    let simHTML = ` = <span class="block">${simText || '_'}</span>`;
    if (item.currentInput.includes('=')) {
        simHTML = ` = <span class="block ${report.simCorrect ? 'block-correct' : 'block-incorrect'}">${simText || '?'}</span>`;
    }
    
    let finHTML = '';
    if (parts.length > 1) {
        if (finText.trim().length >= targetLen) {
            finHTML = ` = <span class="block ${report.finCorrect ? 'block-correct' : 'block-incorrect'}">${finText}</span>`;
        } else if (finText.trim().length > 0) {
            finHTML = ` = <span class="block">${finText}</span>`; // Ждем полный ответ
        } else {
            finHTML = ` = <span class="block">_</span>`;
        }
    }
    return { simHTML, finHTML };
}
