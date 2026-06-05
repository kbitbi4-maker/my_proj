// version: v1.1
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks, soundFlags } from './feedback.js';
import { generateExample, getTensHistoryHTML, renderTensVisual } from './tens.js';
import { generateMultiExample, getMultiplicationHistoryHTML, syncMonsterGame } from './multiplication.js';
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

    handleInputSounds(state.validateCurrentInput(), activeItem.exampleText);
    refreshUI();
}

export function confirmAndNext() {
    resetAllFeedbacks();
    if (state.currentMode === 'tens' || state.currentMode === 'hundreds') generateExample();
    else if (state.currentMode === 'multiplication') generateMultiExample();
    else if (state.currentMode === 'mix') generateMixExample();
}

function handleInputSounds(report, exampleText) {
    if (report.isFullySolved && !soundFlags.finWinSoundPlayed) {
        if (exampleText.includes('×')) triggerWinFeedback(); else triggerTensWinSound();
        soundFlags.finWinSoundPlayed = soundFlags.simWinSoundPlayed = true;
    } else if (report.simCorrect && report.phase === 2 && !soundFlags.simWinSoundPlayed) {
        triggerTensWinSound(); soundFlags.simWinSoundPlayed = true;
    } else if (report.isWrongAnswer) {
        const hasFin = state.examplesHistory[state.activeIndex].currentInput.split('=').length > 1;
        if (hasFin && !soundFlags.finFailSoundPlayed) { triggerFailFeedback(); soundFlags.finFailSoundPlayed = true; }
        else if (!hasFin && !soundFlags.simFailSoundPlayed) { triggerFailFeedback(); soundFlags.simFailSoundPlayed = true; }
    }
}

export function refreshUI() {
    const item = state.examplesHistory[state.activeIndex]; if (!item) return;
    const isMulti = item.exampleText.includes('×');
    const renderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, renderer);
    
    if (state.currentMode === 'multiplication' || (state.currentMode === 'mix' && isMulti)) {
        syncMonsterGame();
    } else {
        renderTensVisual();
    }
}
