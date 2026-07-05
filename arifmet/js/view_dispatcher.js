// version: v2.1 (Полная поддержка деления при переключении истории)
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { syncMonsterGame, getMultiplicationHistoryHTML } from './multiplication.js';
import { renderTensVisual, getTensHistoryHTML } from './tens.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks, soundFlags } from './feedback.js';

export function selectExample(index) {
    state.activeIndex = index;
    resetAllFeedbacks();

    const item = state.examplesHistory[index];
    const report = state.validateCurrentInput(index);
    const isMulti = item.exampleText.includes('×') || item.exampleText.includes('÷');

    if (report.isFullySolved) {
        if (isMulti) triggerWinFeedback(); else triggerTensWinSound();
        soundFlags.finWinSoundPlayed = true; soundFlags.simWinSoundPlayed = true;
    } else if (report.simCorrect && report.phase === 2) {
        triggerTensWinSound();
        soundFlags.simWinSoundPlayed = true;
    } else if (report.isWrongAnswer) {
        triggerFailFeedback();
        if (item.currentInput.includes('=')) {
            const parts = item.currentInput.split('=');
            if (parts.length > 1 && parts.at(1).trim().length > 0) soundFlags.finFailSoundPlayed = true;
            else soundFlags.simFailSoundPlayed = true;
        } else if (isMulti) {
            soundFlags.finFailSoundPlayed = true;
        }
    }

    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);

    if (state.currentMode === 'multiplication' || (state.currentMode === 'mix' && item.exampleText.includes('×'))) {
        syncMonsterGame();
    } else if (state.currentMode === 'division') {
        import('./division_visual.js').then(m => m.renderDivisionVisual());
    } else {
        renderTensVisual();
    }
}
