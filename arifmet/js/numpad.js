// version: v1.5
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { VisualEngine } from './visual_engine.js';
import { resetAllFeedbacks } from './feedback.js';
import { generateExample, getTensHistoryHTML } from './tens.js';
import { generateMultiExample, getMultiplicationHistoryHTML } from './multiplication.js';
import { generateMixExample } from './mix.js';

export function pressNum(n) {
    if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
    const activeItem = state.examplesHistory[state.activeIndex];

    if (n === 'C' || n === 'D') {
        activeItem.currentInput = (n === 'C') ? '' : activeItem.currentInput.slice(0, -1);
        resetAllFeedbacks();
    } else {
        if (n === '=' && (activeItem.currentInput.match(/=/g) || []).length >= 2) return;
        activeItem.currentInput += n;
    }
    refreshUI();
}

export function confirmAndNext() {
    resetAllFeedbacks();
    if (state.currentMode === 'tens' || state.currentMode === 'hundreds') generateExample();
    else if (state.currentMode === 'multiplication') generateMultiExample();
    else if (state.currentMode === 'mix') generateMixExample();
}

export function refreshUI() {
    const ctx = state.getContext(); if (!ctx) return;
    const renderer = ctx.operation === '×' ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, renderer);
    VisualEngine.render(ctx); // Вся магия звуков и картинок ушла внутрь!
}
