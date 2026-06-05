// version: v1.3
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { VisualEngine } from './visual_engine.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks, soundFlags } from './feedback.js';
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
    const ctx = state.getContext();
    if (!ctx) return;
    const renderer = ctx.operation === '×' ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    
    // Левую панель истории по-прежнему обновляем через фундамент GameCanvas
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, renderer);
    // А всю нижнюю графику берет на себя универсальный движок правил!
    VisualEngine.render(ctx);
}
