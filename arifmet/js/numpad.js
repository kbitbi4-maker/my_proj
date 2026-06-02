import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks } from './feedback.js';
import { generateExample, renderTensVisual, getTensHistoryHTML } from './tens.js';
import { generateMultiExample, renderMonsterGame, getMultiplicationHistoryHTML } from './multiplication.js';
import { generateMixExample } from './mix.js';

export function pressNum(n) {
    if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
    const activeItem = state.examplesHistory[state.activeIndex];

    if (n === 'C' || n === 'D') {
        activeItem.currentInput = (n === 'C') ? '' : activeItem.currentInput.slice(0, -1);
        resetAllFeedbacks();
    } else {
        const totalEquals = (activeItem.currentInput.match(/=/g) || []).length;
        if (n === '=' && totalEquals >= 2) return;
        activeItem.currentInput += n;
    }

    const report = state.validateCurrentInput();
    handleInputSounds(report);
    refreshUI();
}

export function confirmAndNext() {
    resetAllFeedbacks();
    if (state.currentMode === 'tens') generateExample();
    else if (state.currentMode === 'multiplication') generateMultiExample();
    else if (state.currentMode === 'mix') generateMixExample();
}

function handleInputSounds(report) {
    if (report.isFullySolved) {
        if (state.currentMode === 'multiplication' || state.currentMode === 'mix') triggerWinFeedback();
        else triggerTensWinSound();
    } else if (report.isWrongAnswer) {
        triggerFailFeedback();
    }
}

export function refreshUI() {
    const isMulti = state.currentMode === 'multiplication';
    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);
    
    if (isMulti) renderMonsterGame();
    else renderTensVisual();
}
