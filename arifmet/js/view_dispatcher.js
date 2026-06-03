import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { syncMonsterGame, getMultiplicationHistoryHTML } from './multiplication.js';
import { renderTensVisual, getTensHistoryHTML } from './tens.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks } from './feedback.js';

export function selectExample(index) {
    state.activeIndex = index;
    resetAllFeedbacks();

    const item = state.examplesHistory[index];
    const report = state.validateCurrentInput(index);
    const isMulti = item.exampleText.includes('×');

    // Распределяем звуки стадий строго по математическому знаку примера
    if (report.isFullySolved) {
        if (isMulti) triggerWinFeedback();
        else triggerTensWinSound();
    } else if (report.simCorrect && report.phase === 2) {
        if (!isMulti) triggerTensWinSound();
    } else if (report.isWrongAnswer) {
        triggerFailFeedback();
    }

    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);

    if (state.currentMode === 'multiplication' || (state.currentMode === 'mix' && isMulti)) {
        syncMonsterGame();
    } else {
        renderTensVisual();
    }
}
